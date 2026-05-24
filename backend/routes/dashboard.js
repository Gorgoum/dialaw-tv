const express = require('express');
const { pool } = require('../database');
const { authMiddleware } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  const { annee, mois } = req.query;
  const now = new Date();
  const year = String(annee || now.getFullYear());
  const month = String(mois || now.getMonth() + 1).padStart(2, '0');

  const dateDebut = `${year}-${month}-01`;
  const dateFin   = `${year}-${month}-31`;

  const [totalEntrees, totalSorties, nbOps, totalEntreesAnnee, totalSortiesAnnee, parMois, topEntrees, topSorties, dernieres] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(montant), 0) as total FROM operations WHERE type='entree' AND date BETWEEN $1 AND $2`, [dateDebut, dateFin]),
    pool.query(`SELECT COALESCE(SUM(montant), 0) as total FROM operations WHERE type='sortie' AND date BETWEEN $1 AND $2`, [dateDebut, dateFin]),
    pool.query(`SELECT COUNT(*) as n FROM operations WHERE date BETWEEN $1 AND $2`, [dateDebut, dateFin]),
    pool.query(`SELECT COALESCE(SUM(montant), 0) as total FROM operations WHERE type='entree' AND EXTRACT(YEAR FROM date::date) = $1`, [year]),
    pool.query(`SELECT COALESCE(SUM(montant), 0) as total FROM operations WHERE type='sortie' AND EXTRACT(YEAR FROM date::date) = $1`, [year]),
    pool.query(`
      SELECT TO_CHAR(date::date, 'MM') as mois,
        SUM(CASE WHEN type='entree' THEN montant ELSE 0 END) as entrees,
        SUM(CASE WHEN type='sortie' THEN montant ELSE 0 END) as sorties
      FROM operations WHERE EXTRACT(YEAR FROM date::date) = $1
      GROUP BY mois ORDER BY mois
    `, [year]),
    pool.query(`SELECT categorie, SUM(montant) as total FROM operations WHERE type='entree' AND date BETWEEN $1 AND $2 GROUP BY categorie ORDER BY total DESC LIMIT 5`, [dateDebut, dateFin]),
    pool.query(`SELECT categorie, SUM(montant) as total FROM operations WHERE type='sortie' AND date BETWEEN $1 AND $2 GROUP BY categorie ORDER BY total DESC LIMIT 5`, [dateDebut, dateFin]),
    pool.query(`SELECT o.*, u.nom as saisi_par_nom FROM operations o JOIN users u ON o.saisi_par = u.id ORDER BY o.created_at DESC LIMIT 5`),
  ]);

  const e = parseFloat(totalEntrees.rows[0].total);
  const s = parseFloat(totalSorties.rows[0].total);
  const ea = parseFloat(totalEntreesAnnee.rows[0].total);
  const sa = parseFloat(totalSortiesAnnee.rows[0].total);

  res.json({
    mois: { entrees: e, sorties: s, solde: e - s, nb_operations: parseInt(nbOps.rows[0].n) },
    annee: { entrees: ea, sorties: sa, solde: ea - sa },
    graphique_mensuel: parMois.rows,
    top_entrees: topEntrees.rows,
    top_sorties: topSorties.rows,
    dernieres_operations: dernieres.rows,
  });
});

module.exports = router;
