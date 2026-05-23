const express = require('express');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { date_debut, date_fin, type, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (date_debut) { where.push('o.date >= ?'); params.push(date_debut); }
  if (date_fin)   { where.push('o.date <= ?'); params.push(date_fin); }
  if (type)       { where.push('o.type = ?'); params.push(type); }
  if (search) {
    where.push('(o.description LIKE ? OR o.categorie LIKE ? OR o.notes LIKE ? OR o.concerne LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as n FROM operations o ${whereStr}`).get(...params).n;

  const rows = db.prepare(`
    SELECT o.*, u.nom as saisi_par_nom
    FROM operations o
    JOIN users u ON o.saisi_par = u.id
    ${whereStr}
    ORDER BY o.date DESC, o.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), Number(offset));

  res.json({ data: rows, total, page: Number(page), pages: Math.ceil(total / limit) });
});

router.post('/', (req, res) => {
  const { date, description, type, categorie, montant, notes, concerne } = req.body;

  if (!date || !description || !type || !categorie || !montant) {
    return res.status(400).json({ error: 'Date, description, type, catégorie et montant sont obligatoires' });
  }

  const result = db.prepare(`
    INSERT INTO operations (date, description, type, categorie, montant, notes, concerne, saisi_par)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(date, description, type, categorie, Number(montant), notes || null, concerne || null, req.user.id);

  const op = db.prepare(`
    SELECT o.*, u.nom as saisi_par_nom FROM operations o
    JOIN users u ON o.saisi_par = u.id WHERE o.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(op);
});

router.put('/:id', adminOnly, (req, res) => {
  const { date, description, type, categorie, montant, notes, concerne } = req.body;
  const op = db.prepare('SELECT id FROM operations WHERE id = ?').get(req.params.id);
  if (!op) return res.status(404).json({ error: 'Opération introuvable' });

  db.prepare(`
    UPDATE operations SET date=?, description=?, type=?, categorie=?, montant=?, notes=?, concerne=? WHERE id=?
  `).run(date, description, type, categorie, Number(montant), notes || null, concerne || null, req.params.id);

  res.json(db.prepare(`
    SELECT o.*, u.nom as saisi_par_nom FROM operations o
    JOIN users u ON o.saisi_par = u.id WHERE o.id = ?
  `).get(req.params.id));
});

router.delete('/:id', adminOnly, (req, res) => {
  const op = db.prepare('SELECT id FROM operations WHERE id = ?').get(req.params.id);
  if (!op) return res.status(404).json({ error: 'Opération introuvable' });
  db.prepare('DELETE FROM operations WHERE id = ?').run(req.params.id);
  res.json({ message: 'Opération supprimée' });
});

module.exports = router;
