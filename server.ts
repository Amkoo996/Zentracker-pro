import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("zentracker.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/entries", (req, res) => {
    const entries = db.prepare("SELECT * FROM mood_entries ORDER BY created_at DESC").all();
    res.json(entries);
  });

  app.post("/api/entries", (req, res) => {
    const { mood, note } = req.body;
    const info = db.prepare("INSERT INTO mood_entries (mood, note) VALUES (?, ?)").run(mood, note);
    res.json({ id: info.lastInsertRowid, mood, note, created_at: new Date().toISOString() });
  });

  app.delete("/api/entries/:id", (req, res) => {
    db.prepare("DELETE FROM mood_entries WHERE id = ?").run(req.params.id);
    res.sendStatus(204);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
