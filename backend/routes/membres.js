const express = require('express');
const { pool } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const tous = req.query.tous === '1';
  const { rows } = await pool.query(
    tous ? 'SELECT * FROM membres ORDER BY nom' : 'SELECT * FROM membres WHERE actif = 1 ORDER BY nom'
  );
  res.json(rows);
});

router.post('/', adminOnly, async (req, res) => {
  const { nom, prenom, telephone, email } = req.body;
  if (!nom || !nom.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });

  const exist = await pool.query('SELECT id FROM membres WHERE nom = $1', [nom.trim()]);
  if (exist.rows.length > 0) return res.status(400).json({ error: 'Ce membre existe déjà' });

  const { rows } = await pool.query(
    'INSERT INTO membres (nom, prenom, telephone, email) VALUES ($1, $2, $3, $4) RETURNING *',
    [nom.trim(), prenom || null, telephone || null, email || null]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', adminOnly, async (req, res) => {
  const { nom, prenom, telephone, email, actif } = req.body;
  const exist = await pool.query('SELECT * FROM membres WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Membre introuvable' });

  const { rows } = await pool.query(
    'UPDATE membres SET nom=$1, prenom=$2, telephone=$3, email=$4, actif=$5 WHERE id=$6 RETURNING *',
    [nom.trim(), prenom || null, telephone || null, email || null, actif, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', adminOnly, async (req, res) => {
  const exist = await pool.query('SELECT * FROM membres WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Membre introuvable' });
  await pool.query('DELETE FROM membres WHERE id = $1', [req.params.id]);
  res.json({ message: 'Membre supprimé' });
});

module.exports = router;
