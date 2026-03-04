import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { config } from "./config.js";

const app = express();
app.use(express.json());

app.use(cors({
  origin: config.clientOrigin === "*" ? true : config.clientOrigin
}));

let db;

try {
  db = new Database(config.dbUrl);
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      notes TEXT,
      pinned INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL
    );
  `);
} catch (err) {
  console.error("Database connection failed:", err.message);
  process.exit(1);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

app.get("/api/trips", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM trips ORDER BY pinned DESC, createdAt DESC").all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/trips", (req, res, next) => {
  try {
    const { id, title, location, startDate, endDate, notes, pinned, createdAt } = req.body;

    if (!id || !title || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    db.prepare(`
      INSERT INTO trips (id, title, location, startDate, endDate, notes, pinned, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      location,
      startDate || "",
      endDate || "",
      notes || "",
      pinned ? 1 : 0,
      createdAt || Date.now()
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.put("/api/trips/:id", (req, res, next) => {
  try {
    const tripId = req.params.id;
    const { title, location, startDate, endDate, notes, pinned } = req.body;

    const info = db.prepare(`
      UPDATE trips
      SET title = ?, location = ?, startDate = ?, endDate = ?, notes = ?, pinned = ?
      WHERE id = ?
    `).run(
      title,
      location,
      startDate || "",
      endDate || "",
      notes || "",
      pinned ? 1 : 0,
      tripId
    );

    if (info.changes === 0) return res.status(404).json({ message: "Trip not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/trips/:id", (req, res, next) => {
  try {
    const tripId = req.params.id;
    const info = db.prepare("DELETE FROM trips WHERE id = ?").run(tripId);
    if (info.changes === 0) return res.status(404).json({ message: "Trip not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("API Error:", err.message);
  res.status(500).json({ message: "Server error. Please try again." });
});

app.listen(config.port, () => {
  console.log(`API running on port ${config.port}`);
});