const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, nom, email, role, actif, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password || !role) return res.status(400).json({ error: 'Tous les champs requis' });

  const exist = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exist) return res.status(400).json({ error: 'Email déjà utilisé' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)').run(nom, email, hash, role);
  const user = db.prepare('SELECT id, nom, email, role, actif, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const { nom, email, role, actif, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET nom=?, email=?, role=?, actif=?, password=? WHERE id=?').run(nom, email, role, actif, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET nom=?, email=?, role=?, actif=? WHERE id=?').run(nom, email, role, actif, req.params.id);
  }

  res.json(db.prepare('SELECT id, nom, email, role, actif, created_at FROM users WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  if (req.params.id == req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  db.prepare('UPDATE users SET actif = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Utilisateur désactivé' });
});

module.exports = router;
