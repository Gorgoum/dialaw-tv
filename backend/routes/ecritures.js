const express = require('express');
const { pool } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { date_debut, date_fin, type, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];
  let i = 1;

  if (date_debut) { where.push(`o.date >= $${i++}`); params.push(date_debut); }
  if (date_fin)   { where.push(`o.date <= $${i++}`); params.push(date_fin); }
  if (type)       { where.push(`o.type = $${i++}`); params.push(type); }
  if (search) {
    where.push(`(o.description ILIKE $${i} OR o.categorie ILIKE $${i} OR o.notes ILIKE $${i} OR o.concerne ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const countResult = await pool.query(`SELECT COUNT(*) as n FROM operations o ${whereStr}`, params);
  const total = parseInt(countResult.rows[0].n);

  const rows = await pool.query(`
    SELECT o.*, u.nom as saisi_par_nom
    FROM operations o
    JOIN users u ON o.saisi_par = u.id
    ${whereStr}
    ORDER BY o.date DESC, o.id DESC
    LIMIT $${i++} OFFSET $${i++}
  `, [...params, Number(limit), Number(offset)]);

  res.json({ data: rows.rows, total, page: Number(page), pages: Math.ceil(total / limit) });
});

router.post('/', async (req, res) => {
  const { date, description, type, categorie, montant, notes, concerne } = req.body;
  if (!date || !description || !type || !categorie || !montant)
    return res.status(400).json({ error: 'Date, description, type, catégorie et montant sont obligatoires' });

  const { rows } = await pool.query(`
    INSERT INTO operations (date, description, type, categorie, montant, notes, concerne, saisi_par)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [date, description, type, categorie, Number(montant), notes || null, concerne || null, req.user.id]);

  const op = await pool.query(
    'SELECT o.*, u.nom as saisi_par_nom FROM operations o JOIN users u ON o.saisi_par = u.id WHERE o.id = $1',
    [rows[0].id]
  );
  res.status(201).json(op.rows[0]);
});

router.put('/:id', adminOnly, async (req, res) => {
  const { date, description, type, categorie, montant, notes, concerne } = req.body;
  const exist = await pool.query('SELECT id FROM operations WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Opération introuvable' });

  await pool.query(`
    UPDATE operations SET date=$1, description=$2, type=$3, categorie=$4, montant=$5, notes=$6, concerne=$7 WHERE id=$8
  `, [date, description, type, categorie, Number(montant), notes || null, concerne || null, req.params.id]);

  const op = await pool.query(
    'SELECT o.*, u.nom as saisi_par_nom FROM operations o JOIN users u ON o.saisi_par = u.id WHERE o.id = $1',
    [req.params.id]
  );
  res.json(op.rows[0]);
});

router.delete('/:id', adminOnly, async (req, res) => {
  const exist = await pool.query('SELECT id FROM operations WHERE id = $1', [req.params.id]);
  if (exist.rows.length === 0) return res.status(404).json({ error: 'Opération introuvable' });
  await pool.query('DELETE FROM operations WHERE id = $1', [req.params.id]);
  res.json({ message: 'Opération supprimée' });
});

module.exports = router;
