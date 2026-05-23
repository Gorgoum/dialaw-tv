const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dialaw_tv_secret_2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token invalide' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé à l\'administrateur' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, SECRET };
