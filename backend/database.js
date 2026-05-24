const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'comptable')),
      actif INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS operations (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('entree', 'sortie')),
      categorie TEXT NOT NULL,
      montant REAL NOT NULL CHECK(montant > 0),
      notes TEXT,
      concerne TEXT,
      saisi_par INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('entree', 'sortie')),
      actif INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS membres (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT,
      telephone TEXT,
      email TEXT,
      actif INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comptes (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      numero TEXT,
      solde_initial REAL DEFAULT 0,
      actif INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const adminExist = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@dialawtv.sn']);
  if (adminExist.rows.length === 0) {
    const hash = bcrypt.hashSync('admin2024', 10);
    await pool.query('INSERT INTO users (nom, email, password, role) VALUES ($1, $2, $3, $4)',
      ['PDG Dialaw TV', 'admin@dialawtv.sn', hash, 'admin']);
  }

  const comptableExist = await pool.query('SELECT id FROM users WHERE email = $1', ['comptable@dialawtv.sn']);
  if (comptableExist.rows.length === 0) {
    const hash = bcrypt.hashSync('comptable2024', 10);
    await pool.query('INSERT INTO users (nom, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Comptable', 'comptable@dialawtv.sn', hash, 'comptable']);
  }
}

module.exports = { pool, initDB };
