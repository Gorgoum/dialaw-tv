const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'dialaw_journal.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'comptable')),
    actif INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('entree', 'sortie')),
    categorie TEXT NOT NULL,
    montant REAL NOT NULL CHECK(montant > 0),
    saisi_par INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (saisi_par) REFERENCES users(id)
  );
`);

// Ajouter colonne notes si elle n'existe pas (migration douce)
try { db.exec('ALTER TABLE operations ADD COLUMN notes TEXT'); } catch {}

// Utilisateurs par défaut
const adminExist = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@dialawtv.sn');
if (!adminExist) {
  const hash = bcrypt.hashSync('admin2024', 10);
  db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)').run(
    'PDG Dialaw TV', 'admin@dialawtv.sn', hash, 'admin'
  );
}

const comptableExist = db.prepare('SELECT id FROM users WHERE email = ?').get('comptable@dialawtv.sn');
if (!comptableExist) {
  const hash = bcrypt.hashSync('comptable2024', 10);
  db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Comptable', 'comptable@dialawtv.sn', hash, 'comptable'
  );
}

module.exports = db;
