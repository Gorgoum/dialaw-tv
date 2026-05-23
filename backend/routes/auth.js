const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authMiddleware, SECRET } = require('../middleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND actif = 1').get(email);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign(
    { id: user.id, nom: user.nom, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
