const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT id, nom, email, role, actif, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password || !role) return res.status(400).json({ error: 'Tous les champs requis' });

  const exist = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exist.rows.length > 0) return res.status(400).json({ error: 'Email déjà utilisé' });

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (nom, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, actif, created_at',
    [nom, email, hash, role]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { nom, email, role, actif, password } = req.body;
  const exist = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });

  let result;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    result = await pool.query(
      'UPDATE users SET nom=$1, email=$2, role=$3, actif=$4, password=$5 WHERE id=$6 RETURNING id, nom, email, role, actif, created_at',
      [nom, email, role, actif, hash, req.params.id]
    );
  } else {
    result = await pool.query(
      'UPDATE users SET nom=$1, email=$2, role=$3, actif=$4 WHERE id=$5 RETURNING id, nom, email, role, actif, created_at',
      [nom, email, role, actif, req.params.id]
    );
  }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  if (req.params.id == req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  await pool.query('UPDATE users SET actif = 0 WHERE id = $1', [req.params.id]);
  res.json({ message: 'Utilisateur désactivé' });
});

module.exports = router;
