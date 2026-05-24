const express = require('express');
const { pool } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM comptes ORDER BY nom');
  res.json(rows);
});

router.post('/', adminOnly, async (req, res) => {
  const { nom, numero, solde_initial } = req.body;
  if (!nom) return res.status(400).json({ error: 'Le nom est obligatoire' });

  const { rows } = await pool.query(
    'INSERT INTO comptes (nom, numero, solde_initial) VALUES ($1, $2, $3) RETURNING *',
    [nom, numero || null, solde_initial || 0]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', adminOnly, async (req, res) => {
  const { nom, numero, solde_initial, actif } = req.body;
  const exist = await pool.query('SELECT * FROM comptes WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable' });

  const { rows } = await pool.query(
    'UPDATE comptes SET nom=$1, numero=$2, solde_initial=$3, actif=$4 WHERE id=$5 RETURNING *',
    [nom, numero || null, solde_initial || 0, actif, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', adminOnly, async (req, res) => {
  const exist = await pool.query('SELECT * FROM comptes WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable' });
  await pool.query('DELETE FROM comptes WHERE id = $1', [req.params.id]);
  res.json({ message: 'Compte supprimé' });
});

module.exports = router;
