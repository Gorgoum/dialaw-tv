const express = require('express');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// Toutes les catégories actives (pour le formulaire)
router.get('/', (req, res) => {
  const { type, tous } = req.query;
  let query = tous === '1' ? 'SELECT * FROM categories' : 'SELECT * FROM categories WHERE actif = 1';
  if (type) query += ` AND type = '${type === 'entree' ? 'entree' : 'sortie'}'`;
  query += ' ORDER BY type, nom';
  res.json(db.prepare(query).all());
});

router.post('/', adminOnly, (req, res) => {
  const { nom, type } = req.body;
  if (!nom || !nom.trim() || !type) return res.status(400).json({ error: 'Nom et type sont obligatoires' });
  const exist = db.prepare('SELECT id FROM categories WHERE nom = ? AND type = ?').get(nom.trim(), type);
  if (exist) return res.status(400).json({ error: 'Cette catégorie existe déjà' });
  const r = db.prepare('INSERT INTO categories (nom, type) VALUES (?, ?)').run(nom.trim(), type);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', adminOnly, (req, res) => {
  const { nom, type, actif } = req.body;
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
  db.prepare('UPDATE categories SET nom=?, type=?, actif=? WHERE id=?').run(nom.trim(), type, actif, req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

router.delete('/:id', adminOnly, (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Catégorie supprimée' });
});

module.exports = router;
