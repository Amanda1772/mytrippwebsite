import express from "express";
import cors from "cors";
import "dotenv/config";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";

// ---------- App + Config ----------
const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8080);
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const DATABASE_URL = process.env.DATABASE_URL || "./db.json";

// Dev vs Prod CORS configuration
app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN
  })
);

// ---------- Database (JSON file) ----------
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

// ---------- Helpers ----------
function sortTrips(trips) {
  return [...trips].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

// ---------- Routes ----------

// This fixes "Cannot GET /" by giving the root a real response
app.get("/", (req, res) => {
  res.send("MyTrip API is running. Try /api/health or /api/trips");
});

// Health check endpoint for your assignment
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: NODE_ENV, port: PORT });
});

// Read all trips
app.get("/api/trips", async (req, res, next) => {
  try {
    await db.read();
    res.json(sortTrips(db.data.trips || []));
  } catch (err) {
    next(err);
  }
});

// Create a trip
app.post("/api/trips", async (req, res, next) => {
  try {
    const { id, title, location, startDate, endDate, notes, pinned, createdAt } = req.body || {};

    if (!id || !title || !location) {
      return res.status(400).json({ message: "Missing required fields: id, title, location" });
    }

    await db.read();
    const exists = db.data.trips.some(t => t.id === id);
    if (exists) return res.status(409).json({ message: "Trip with that id already exists" });

    db.data.trips.push({
      id,
      title,
      location,
      startDate: startDate || "",
      endDate: endDate || "",
      notes: notes || "",
      pinned: !!pinned,
      createdAt: createdAt || Date.now()
    });

    await db.write();
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Update a trip
app.put("/api/trips/:id", async (req, res, next) => {
  try {
    const tripId = req.params.id;

    await db.read();
    const idx = db.data.trips.findIndex(t => t.id === tripId);
    if (idx === -1) return res.status(404).json({ message: "Trip not found" });

    const current = db.data.trips[idx];

    db.data.trips[idx] = {
      ...current,
      ...req.body,
      id: tripId
    };

    await db.write();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Delete a trip
app.delete("/api/trips/:id", async (req, res, next) => {
  try {
    const tripId = req.params.id;

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

// Global error handler (required for credit)
app.use((err, req, res, next) => {
  console.error("API Error:", err.message);
  res.status(500).json({ message: "Server error. Please try again." });
});

// ---------- Start ----------
await initDb();

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
});