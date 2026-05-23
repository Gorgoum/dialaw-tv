import React, { useState, useEffect } from 'react';
import api from '../api';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatXOF(n) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [filtre, setFiltre] = useState({
    annee: now.getFullYear(),
    mois: String(now.getMonth() + 1).padStart(2, '0'),
  });

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/stats?annee=${filtre.annee}&mois=${filtre.mois}`)
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, [filtre]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
    </div>
  );

  const m = stats?.mois || {};
  const a = stats?.annee || {};

  const graphData = (stats?.graphique_mensuel || []).map(row => ({
    mois: MOIS_NOMS[parseInt(row.mois) - 1],
    Entrées: row.entrees,
    Sorties: row.sorties,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue financière de Dialaw TV</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={filtre.mois} onChange={e => setFiltre({ ...filtre, mois: e.target.value })} style={{ width: 'auto', padding: '8px 12px' }}>
            {MOIS_NOMS.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
          <select value={filtre.annee} onChange={e => setFiltre({ ...filtre, annee: e.target.value })} style={{ width: 'auto', padding: '8px 12px' }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats du mois */}
      <div className="grid-4 grid-single-mobile" style={{ marginBottom: '16px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: '#d5f5e3' }}>
            <TrendingDown size={24} color="var(--success)" />
          </div>
          <div>
            <div className="stat-label">Entrées du mois</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatXOF(m.entrees)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.nb_operations} opération(s)</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-icon" style={{ background: '#fadbd8' }}>
            <TrendingUp size={24} color="var(--danger)" />
          </div>
          <div>
            <div className="stat-label">Sorties du mois</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{formatXOF(m.sorties)}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: `4px solid ${m.solde >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-icon" style={{ background: m.solde >= 0 ? '#d5f5e3' : '#fadbd8' }}>
            <DollarSign size={24} color={m.solde >= 0 ? 'var(--success)' : 'var(--danger)'} />
          </div>
          <div>
            <div className="stat-label">Solde du mois</div>
            <div className="stat-value" style={{ color: m.solde >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {m.solde >= 0 ? '+' : ''}{formatXOF(m.solde)}
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: `4px solid ${a.solde >= 0 ? 'var(--info)' : 'var(--danger)'}` }}>
          <div className="stat-icon" style={{ background: '#d6eaf8' }}>
            <Activity size={24} color="var(--info)" />
          </div>
          <div>
            <div className="stat-label">Solde annuel {filtre.annee}</div>
            <div className="stat-value" style={{ color: a.solde >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {a.solde >= 0 ? '+' : ''}{formatXOF(a.solde)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique + Top catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px' }}>
            Évolution mensuelle {filtre.annee}
          </h3>
          {graphData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              Aucune donnée pour cette année
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => formatXOF(v)} />
                <Legend />
                <Bar dataKey="Entrées" fill="#27ae60" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sorties" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: 'var(--success)' }}>
              💰 Top Entrées par catégorie
            </h3>
            {stats?.top_entrees?.length ? stats.top_entrees.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span>{t.categorie}</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }}>{formatXOF(t.total)}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucune entrée ce mois</p>}
          </div>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: 'var(--danger)' }}>
              💸 Top Sorties par catégorie
            </h3>
            {stats?.top_sorties?.length ? stats.top_sorties.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span>{t.categorie}</span>
                <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{formatXOF(t.total)}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucune sortie ce mois</p>}
          </div>
        </div>
      </div>

      {/* Dernières opérations */}
      <div className="card">
        <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '16px' }}>Dernières opérations</h3>
        {stats?.dernieres_operations?.length ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Saisi par</th>
              </tr>
            </thead>
            <tbody>
              {stats.dernieres_operations.map(op => (
                <tr key={op.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      background: op.type === 'entree' ? '#d5f5e3' : '#fadbd8',
                      color: op.type === 'entree' ? '#1e8449' : '#922b21',
                    }}>
                      {op.type === 'entree' ? '↓ Entrée' : '↑ Sortie'}
                    </span>
                  </td>
                  <td>{op.description}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{op.categorie}</td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: op.type === 'entree' ? 'var(--success)' : 'var(--danger)' }}>
                    {op.type === 'entree' ? '+' : '-'}{formatXOF(op.montant)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{op.saisi_par_nom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            Aucune opération pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
