const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'kalme2025';
const DB_PATH = path.join(__dirname, 'data.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadastral_code TEXT NOT NULL,
    price REAL, area_ha REAL, description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  saveDB();
}

function saveDB() { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); }

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) { return queryAll(sql, params)[0] || null; }
function run(sql, params = []) { db.run(sql, params); saveDB(); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_PASS) return next();
  if (req.headers.cookie && req.headers.cookie.includes(`admin=${ADMIN_PASS}`)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.get('/api/listings', (req, res) => {
  res.json(queryAll("SELECT id,cadastral_code,price,area_ha,description,status,created_at FROM listings WHERE status='active' ORDER BY created_at DESC"));
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASS) {
    res.setHeader('Set-Cookie', `admin=${ADMIN_PASS}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    res.json({ ok: true });
  } else { res.status(401).json({ error: 'Nepareiza parole' }); }
});

app.get('/api/admin/listings', requireAdmin, (req, res) => {
  res.json(queryAll('SELECT * FROM listings ORDER BY created_at DESC'));
});

app.post('/api/admin/listings', requireAdmin, (req, res) => {
  const { cadastral_code, price, area_ha, description } = req.body;
  if (!cadastral_code) return res.status(400).json({ error: 'Kadastra apzīmējums ir obligāts' });
  run('INSERT INTO listings (cadastral_code,price,area_ha,description) VALUES (?,?,?,?)',
    [cadastral_code, price||null, area_ha||null, description||'']);
  const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  res.json(queryOne('SELECT * FROM listings WHERE id=?', [id]));
});

app.put('/api/admin/listings/:id', requireAdmin, (req, res) => {
  const { cadastral_code, price, area_ha, description, status } = req.body;
  run('UPDATE listings SET cadastral_code=?,price=?,area_ha=?,description=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [cadastral_code, price||null, area_ha||null, description||'', status||'active', req.params.id]);
  const row = queryOne('SELECT * FROM listings WHERE id=?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.delete('/api/admin/listings/:id', requireAdmin, (req, res) => {
  run('DELETE FROM listings WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/admin/import', requireAdmin, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be array' });
  let count = 0;
  for (const item of items) {
    if (!item.cadastral_code) continue;
    db.run('INSERT INTO listings (cadastral_code,price,area_ha,description) VALUES (?,?,?,?)',
      [item.cadastral_code, item.price||null, item.area_ha||null, item.description||'']);
    count++;
  }
  saveDB();
  res.json({ imported: count });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🗺️  Kadastrs app: http://localhost:${PORT}`);
    console.log(`🔑 Admin: http://localhost:${PORT}/admin`);
  });
});
