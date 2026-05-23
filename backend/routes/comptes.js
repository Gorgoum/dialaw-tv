const express = require('express');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const comptes = db.prepare('SELECT * FROM comptes ORDER BY numero').all();
  res.json(comptes);
});

router.post('/', adminOnly, (req, res) => {
  const { numero, libelle, type } = req.body;
  if (!numero || !libelle || !type) return res.status(400).json({ error: 'Tous les champs requis' });

  const exist = db.prepare('SELECT id FROM comptes WHERE numero = ?').get(numero);
  if (exist) return res.status(400).json({ error: 'Ce numéro de compte existe déjà' });

  const result = db.prepare('INSERT INTO comptes (numero, libelle, type) VALUES (?, ?, ?)').run(numero, libelle, type);
  res.status(201).json(db.prepare('SELECT * FROM comptes WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', adminOnly, (req, res) => {
  const { numero, libelle, type } = req.body;
  const compte = db.prepare('SELECT * FROM comptes WHERE id = ?').get(req.params.id);
  if (!compte) return res.status(404).json({ error: 'Compte introuvable' });

  db.prepare('UPDATE comptes SET numero=?, libelle=?, type=? WHERE id=?').run(numero, libelle, type, req.params.id);
  res.json(db.prepare('SELECT * FROM comptes WHERE id = ?').get(req.params.id));
});

router.delete('/:id', adminOnly, (req, res) => {
  const used = db.prepare('SELECT id FROM ecritures WHERE compte_debit_id=? OR compte_credit_id=?').get(req.params.id, req.params.id);
  if (used) return res.status(400).json({ error: 'Ce compte est utilisé dans des écritures, impossible de supprimer' });

  db.prepare('DELETE FROM comptes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Compte supprimé' });
});

module.exports = router;
