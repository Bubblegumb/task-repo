"use strict";
const express = require("express");
const fs      = require("fs");
const path    = require("path");
 
const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "/data";
const NOTES    = path.join(DATA_DIR, "notes.json");
 
// ── Initialise storage ───────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(NOTES))    fs.writeFileSync(NOTES, "[]", "utf8");
 
app.use(express.json());
 
// ── HTML UI ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Cloud Notes</title>
    <style>
      body {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        max-width: 680px;
        margin: 40px auto;
        padding: 0 20px;
        background: #f8fafc;
      }

      h1 {
        color: #1b3a5c;
        margin: 0 0 18px;
        font-size: 28px;
        line-height: 1.1;
        font-weight: 600;
      }

      form {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        margin-bottom: 24px;
      }

      input,
      textarea {
        width: 100%;
        box-sizing: border-box;
        margin: 6px 0 14px;
        padding: 8px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 15px;
        font-family: inherit;
      }

      button {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 9px 22px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 15px;
      }

      .note {
        background: #fff;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      }

      .del {
        background: #dc2626;
        color: #fff;
        float: right;
        padding: 4px 12px;
        font-size: 13px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>Cloud Notes</h1>
    <form id="f">
      <input  id="title"   placeholder="Title"  required/>
      <textarea id="body"  placeholder="Note…" rows="4" required></textarea>
      <button type="submit">Save Note</button>
    </form>
    <div id="list"></div>
    <script>
      async function load() {
        const notes = await fetch("/api/notes").then(r => r.json());
        document.getElementById("list").innerHTML = notes.map(function(n) {
          return '<div class="note">'
            + '<button class="del" onclick="del(' + n.id + ')">Delete</button>'
            + '<strong>' + escapeHtml(n.title) + '</strong><p>' + escapeHtml(n.body) + '</p>'
            + '</div>';
        }).join("");
      }

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      document.getElementById("f").onsubmit = async e => {
        e.preventDefault();
        await fetch("/api/notes", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: document.getElementById("title").value,
            body:  document.getElementById("body").value,
          })});
        e.target.reset(); load();
      };
      async function del(id) {
        await fetch("/api/notes/" + id, { method: "DELETE" }); load();
      }
      load();
    </script>
  </body>
  </html>`);
});
 
// ── API ─────────────────────────────────────────────────────────────────
const readNotes  = ()       => JSON.parse(fs.readFileSync(NOTES, "utf8"));
const writeNotes = (notes)  => fs.writeFileSync(NOTES, JSON.stringify(notes, null, 2));
 
app.get("/api/notes", (req, res) => res.json(readNotes()));
 
app.post("/api/notes", (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const notes = readNotes();
  notes.push({ id: Date.now(), title, body, ts: new Date().toISOString() });
  writeNotes(notes);
  res.json({ ok: true });
});
 
app.delete("/api/notes/:id", (req, res) => {
  writeNotes(readNotes().filter(n => n.id !== Number(req.params.id)));
  res.json({ ok: true });
});
 
// ── Health probe ─────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));
 
app.listen(PORT, () => console.log(`Notes app listening on :${PORT}`));
