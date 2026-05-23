const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/stats', (req, res) => {
  const { annee, mois } = req.query;
  const now = new Date();
  const year = String(annee || now.getFullYear());
  const month = String(mois || now.getMonth() + 1).padStart(2, '0');

  const dateDebut = `${year}-${month}-01`;
  const dateFin   = `${year}-${month}-31`;

  const totalEntrees = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total FROM operations
    WHERE type='entree' AND date BETWEEN ? AND ?
  `).get(dateDebut, dateFin).total;

  const totalSorties = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total FROM operations
    WHERE type='sortie' AND date BETWEEN ? AND ?
  `).get(dateDebut, dateFin).total;

  const nbOps = db.prepare(`
    SELECT COUNT(*) as n FROM operations WHERE date BETWEEN ? AND ?
  `).get(dateDebut, dateFin).n;

  const totalEntreesAnnee = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total FROM operations
    WHERE type='entree' AND strftime('%Y', date) = ?
  `).get(year).total;

  const totalSortiesAnnee = db.prepare(`
    SELECT COALESCE(SUM(montant), 0) as total FROM operations
    WHERE type='sortie' AND strftime('%Y', date) = ?
  `).get(year).total;

  const parMois = db.prepare(`
    SELECT strftime('%m', date) as mois,
      SUM(CASE WHEN type='entree' THEN montant ELSE 0 END) as entrees,
      SUM(CASE WHEN type='sortie' THEN montant ELSE 0 END) as sorties
    FROM operations
    WHERE strftime('%Y', date) = ?
    GROUP BY mois ORDER BY mois
  `).all(year);

  const topEntrees = db.prepare(`
    SELECT categorie, SUM(montant) as total FROM operations
    WHERE type='entree' AND date BETWEEN ? AND ?
    GROUP BY categorie ORDER BY total DESC LIMIT 5
  `).all(dateDebut, dateFin);

  const topSorties = db.prepare(`
    SELECT categorie, SUM(montant) as total FROM operations
    WHERE type='sortie' AND date BETWEEN ? AND ?
    GROUP BY categorie ORDER BY total DESC LIMIT 5
  `).all(dateDebut, dateFin);

  const dernieres = db.prepare(`
    SELECT o.*, u.nom as saisi_par_nom FROM operations o
    JOIN users u ON o.saisi_par = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  res.json({
    mois: { entrees: totalEntrees, sorties: totalSorties, solde: totalEntrees - totalSorties, nb_operations: nbOps },
    annee: { entrees: totalEntreesAnnee, sorties: totalSortiesAnnee, solde: totalEntreesAnnee - totalSortiesAnnee },
    graphique_mensuel: parMois,
    top_entrees: topEntrees,
    top_sorties: topSorties,
    dernieres_operations: dernieres,
  });
});

module.exports = router;
