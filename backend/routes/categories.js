const express = require('express');
const { pool } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { type, tous } = req.query;
  let query = tous === '1' ? 'SELECT * FROM categories' : 'SELECT * FROM categories WHERE actif = 1';
  const params = [];
  if (type) { query += ` AND type = $1`; params.push(type === 'entree' ? 'entree' : 'sortie'); }
  query += ' ORDER BY type, nom';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

router.post('/', adminOnly, async (req, res) => {
  const { nom, type } = req.body;
  if (!nom || !nom.trim() || !type) return res.status(400).json({ error: 'Nom et type sont obligatoires' });

  const exist = await pool.query('SELECT id FROM categories WHERE nom = $1 AND type = $2', [nom.trim(), type]);
  if (exist.rows.length > 0) return res.status(400).json({ error: 'Cette catégorie existe déjà' });

  const { rows } = await pool.query(
    'INSERT INTO categories (nom, type) VALUES ($1, $2) RETURNING *',
    [nom.trim(), type]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', adminOnly, async (req, res) => {
  const { nom, type, actif } = req.body;
  const exist = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });

  const { rows } = await pool.query(
    'UPDATE categories SET nom=$1, type=$2, actif=$3 WHERE id=$4 RETURNING *',
    [nom.trim(), type, actif, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', adminOnly, async (req, res) => {
  const exist = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ message: 'Catégorie supprimée' });
});

module.exports = router;
