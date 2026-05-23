const express = require('express');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// Tous les membres actifs (accessible à tous pour le formulaire d'entrée)
router.get('/', (req, res) => {
  const tous = req.query.tous === '1';
  const membres = db.prepare(
    tous
      ? 'SELECT * FROM membres_equipe ORDER BY nom'
      : 'SELECT * FROM membres_equipe WHERE actif = 1 ORDER BY nom'
  ).all();
  res.json(membres);
});

// Ajouter (admin uniquement)
router.post('/', adminOnly, (req, res) => {
  const { nom, poste } = req.body;
  if (!nom || !nom.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });

  const exist = db.prepare('SELECT id FROM membres_equipe WHERE nom = ?').get(nom.trim());
  if (exist) return res.status(400).json({ error: 'Ce membre existe déjà' });

  const result = db.prepare('INSERT INTO membres_equipe (nom, poste) VALUES (?, ?)').run(nom.trim(), poste || null);
  res.status(201).json(db.prepare('SELECT * FROM membres_equipe WHERE id = ?').get(result.lastInsertRowid));
});

// Modifier (admin uniquement)
router.put('/:id', adminOnly, (req, res) => {
  const { nom, poste, actif } = req.body;
  const m = db.prepare('SELECT * FROM membres_equipe WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Membre introuvable' });

  db.prepare('UPDATE membres_equipe SET nom=?, poste=?, actif=? WHERE id=?').run(nom.trim(), poste || null, actif, req.params.id);
  res.json(db.prepare('SELECT * FROM membres_equipe WHERE id = ?').get(req.params.id));
});

// Supprimer (admin uniquement)
router.delete('/:id', adminOnly, (req, res) => {
  const m = db.prepare('SELECT * FROM membres_equipe WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Membre introuvable' });
  db.prepare('DELETE FROM membres_equipe WHERE id = ?').run(req.params.id);
  res.json({ message: 'Membre supprimé' });
});

module.exports = router;
