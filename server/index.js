import express from "express";
import cors from "cors";
import "dotenv/config";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";

const app = express();
app.use(express.json({ limit: "50kb" }));

const PORT = Number(process.env.PORT || 8080);
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const DATABASE_URL = process.env.DATABASE_URL || "./db.json";

app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN
  })
);

const adapter = new JSONFile(path.resolve(DATABASE_URL));
const db = new Low(adapter, { trips: [] });

async function initDb() {
  try {
    await db.read();
    db.data ||= { trips: [] };
    if (!Array.isArray(db.data.trips)) db.data.trips = [];
    await db.write();
    console.log("Database ready:", path.resolve(DATABASE_URL));
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

// Basic XSS prevention for stored text
function sanitizeText(value, maxLen) {
  const s = String(value ?? "").trim();
  const clipped = s.length > maxLen ? s.slice(0, maxLen) : s;
  return clipped.replaceAll("<", "").replaceAll(">", "");
}

function isIsoDate(d) {
  if (!d) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function validateTripBody(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!body.id) errors.push("id is required");
  }

  if (!body.title || !String(body.title).trim()) errors.push("title is required");
  if (!body.location || !String(body.location).trim()) errors.push("location is required");

  const title = String(body.title || "");
  const location = String(body.location || "");
  const notes = String(body.notes || "");

  if (title.length > 60) errors.push("title must be 60 characters or less");
  if (location.length > 60) errors.push("location must be 60 characters or less");
  if (notes.length > 500) errors.push("notes must be 500 characters or less");

  const startDate = body.startDate || "";
  const endDate = body.endDate || "";

  if (!isIsoDate(startDate)) errors.push("startDate must be YYYY-MM-DD");
  if (!isIsoDate(endDate)) errors.push("endDate must be YYYY-MM-DD");

  if (startDate && endDate && startDate > endDate) errors.push("startDate must be before endDate");

  return errors;
}

function sortTrips(trips) {
  return [...trips].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

app.get("/", (req, res) => {
  res.send("MyTrip API is running. Try /api/health or /api/trips");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: NODE_ENV, port: PORT });
});

app.get("/api/trips", async (req, res, next) => {
  try {
    await db.read();
    res.json(sortTrips(db.data.trips || []));
  } catch (err) {
    next(err);
  }
});

app.post("/api/trips", async (req, res, next) => {
  try {
    const errors = validateTripBody(req.body, false);
    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    await db.read();

    const id = sanitizeText(req.body.id, 80);
    const exists = db.data.trips.some(t => t.id === id);
    if (exists) return res.status(409).json({ message: "Trip with that id already exists" });

    const trip = {
      id,
      title: sanitizeText(req.body.title, 60),
      location: sanitizeText(req.body.location, 60),
      startDate: sanitizeText(req.body.startDate || "", 10),
      endDate: sanitizeText(req.body.endDate || "", 10),
      notes: sanitizeText(req.body.notes || "", 500),
      pinned: !!req.body.pinned,
      createdAt: Number(req.body.createdAt || Date.now())
    };

    db.data.trips.push(trip);
    await db.write();

    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
});

app.put("/api/trips/:id", async (req, res, next) => {
  try {
    const tripId = sanitizeText(req.params.id, 80);

    const errors = validateTripBody({ ...req.body, id: tripId }, true);
    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    await db.read();

    const idx = db.data.trips.findIndex(t => t.id === tripId);
    if (idx === -1) return res.status(404).json({ message: "Trip not found" });

    const current = db.data.trips[idx];

    db.data.trips[idx] = {
      ...current,
      title: sanitizeText(req.body.title, 60),
      location: sanitizeText(req.body.location, 60),
      startDate: sanitizeText(req.body.startDate || "", 10),
      endDate: sanitizeText(req.body.endDate || "", 10),
      notes: sanitizeText(req.body.notes || "", 500),
      pinned: !!req.body.pinned
    };

    await db.write();
    res.json(db.data.trips[idx]);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/trips/:id", async (req, res, next) => {
  try {
    const tripId = sanitizeText(req.params.id, 80);

    await db.read();
    const before = db.data.trips.length;
    db.data.trips = db.data.trips.filter(t => t.id !== tripId);

    if (db.data.trips.length === before) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await db.write();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("API Error:", err.message);
  res.status(500).json({ message: "Server error. Please try again." });
});

await initDb();

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});