import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Pencil, Trash2, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function formatXOF(n) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n || 0);
}


const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  type: 'entree',
  description: '',
  categorie: '',
  montant: '',
  notes: '',
  concerne: [],
};

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function Journal() {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [operations, setOperations] = useState([]);
  const [membres, setMembres] = useState([]);
  const [catsEntree, setCatsEntree] = useState([]);
  const [catsSortie, setCatsSortie] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('entree');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filtre, setFiltre] = useState({ search: '', type: '', date_debut: '', date_fin: '', page: 1 });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filtre).forEach(([k, v]) => { if (v) params.append(k, v); });
    api.get(`/ecritures?${params}`)
      .then(r => { setOperations(r.data.data); setTotal(r.data.total); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [filtre]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/membres').then(r => setMembres(r.data.map(m => m.nom)));
    api.get('/categories?type=entree').then(r => setCatsEntree(r.data.map(c => c.nom)));
    api.get('/categories?type=sortie').then(r => setCatsSortie(r.data.map(c => c.nom)));
  }, []);

  const openCreate = (type) => {
    setEditing(null);
    setModalType(type);
    setForm({ ...EMPTY_FORM, type, categorie: '' });
    setShowModal(true);
  };

  const openEdit = (op) => {
    setEditing(op);
    setModalType(op.type);
    const concerneVal = op.concerne ? op.concerne.split(', ') : [];
    setForm({ date: op.date, type: op.type, description: op.description, categorie: op.categorie, montant: op.montant, notes: op.notes || '', concerne: concerneVal });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, concerne: Array.isArray(form.concerne) ? form.concerne.join(', ') : form.concerne };
      if (editing) {
        await api.put(`/ecritures/${editing.id}`, payload);
        toast.success('Opération modifiée');
      } else {
        await api.post('/ecritures', payload);
        toast.success('Opération enregistrée');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette opération définitivement ?')) return;
    try {
      await api.delete(`/ecritures/${id}`);
      toast.success('Opération supprimée');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const totalEntrees = operations.filter(o => o.type === 'entree').reduce((s, o) => s + o.montant, 0);
  const totalSorties = operations.filter(o => o.type === 'sortie').reduce((s, o) => s + o.montant, 0);
  const solde = totalEntrees - totalSorties;

  const categories = modalType === 'entree' ? catsEntree : catsSortie;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Livre Journal</h1>
          <p className="page-subtitle">{total} opération(s) enregistrée(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-success" onClick={() => openCreate('entree')}>
            <ArrowDownCircle size={18} /> Entrée d'argent
          </button>
          <button className="btn btn-danger" onClick={() => openCreate('sortie')}>
            <ArrowUpCircle size={18} /> Sortie d'argent
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid-3" style={{ marginBottom: '16px' }}>
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>💰 Total Entrées</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--success)' }}>{formatXOF(totalEntrees)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>💸 Total Sorties</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--danger)' }}>{formatXOF(totalSorties)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderTop: `4px solid ${solde >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>📊 Solde</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: solde >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {solde >= 0 ? '+' : ''}{formatXOF(solde)}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label>Recherche</label>
            <input
              placeholder="Description, catégorie..."
              value={filtre.search}
              onChange={e => setFiltre({ ...filtre, search: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label>Type</label>
            <select value={filtre.type} onChange={e => setFiltre({ ...filtre, type: e.target.value, page: 1 })} style={{ width: 'auto' }}>
              <option value="">Tout</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
          </div>
          <div>
            <label>Du</label>
            <input type="date" value={filtre.date_debut} onChange={e => setFiltre({ ...filtre, date_debut: e.target.value, page: 1 })} style={{ width: 'auto' }} />
          </div>
          <div>
            <label>Au</label>
            <input type="date" value={filtre.date_fin} onChange={e => setFiltre({ ...filtre, date_fin: e.target.value, page: 1 })} style={{ width: 'auto' }} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setFiltre({ search: '', type: '', date_debut: '', date_fin: '', page: 1 })}>
            <X size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des opérations */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : operations.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📒</div>
            <p>Aucune opération. Utilisez les boutons <strong>Entrée</strong> ou <strong>Sortie</strong> pour commencer.</p>
          </div>
        ) : isMobile ? (
          /* Vue carte sur mobile */
          <div style={{ padding: '8px' }}>
            {operations.map(op => (
              <div key={op.id} style={{
                background: 'white', borderRadius: '12px', padding: '14px 16px',
                marginBottom: '8px', border: '1px solid var(--border)',
                borderLeft: `4px solid ${op.type === 'entree' ? 'var(--success)' : 'var(--danger)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{op.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(op.date).toLocaleDateString('fr-FR')} · {op.categorie}
                    </div>
                    {op.concerne && (
                      <div style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '2px', fontWeight: '600' }}>
                        👤 {op.concerne}
                      </div>
                    )}
                    {op.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                        {op.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: op.type === 'entree' ? 'var(--success)' : 'var(--danger)' }}>
                      {op.type === 'entree' ? '+' : '-'}{formatXOF(op.montant)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{op.saisi_par_nom}</div>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(op)}><Pencil size={13} /> Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(op.id)}><Trash2 size={13} /> Supprimer</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Vue tableau sur desktop */
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Concerné(e)</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th>Saisi par</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {operations.map(op => (
                <tr key={op.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                      background: op.type === 'entree' ? '#d5f5e3' : '#fadbd8',
                      color: op.type === 'entree' ? '#1e8449' : '#922b21',
                    }}>
                      {op.type === 'entree' ? '↓ Entrée' : '↑ Sortie'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500' }}>{op.description}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{op.categorie}</td>
                  <td style={{ fontSize: '13px', fontWeight: op.concerne ? '600' : 'normal', color: op.concerne ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {op.concerne || (op.type === 'entree' ? '—' : '')}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {op.notes || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '15px', color: op.type === 'entree' ? 'var(--success)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                    {op.type === 'entree' ? '+' : '-'}{formatXOF(op.montant)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{op.saisi_par_nom}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(op)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(op.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${filtre.page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFiltre({ ...filtre, page: p })}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: modalType === 'entree' ? 'var(--success)' : 'var(--danger)' }}>
                {editing ? 'Modifier' : (modalType === 'entree' ? '💰 Nouvelle Entrée' : '💸 Nouvelle Sortie')}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type (visible seulement en modification) */}
              {editing && (
                <div className="form-group">
                  <label>Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['entree', 'sortie'].map(t => (
                      <label key={t} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', padding: '12px', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${form.type === t ? (t === 'entree' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                        background: form.type === t ? (t === 'entree' ? '#d5f5e3' : '#fadbd8') : 'white',
                        fontWeight: '600', fontSize: '14px', textTransform: 'none', letterSpacing: 0,
                      }}>
                        <input type="radio" name="type" value={t} checked={form.type === t}
                          onChange={e => setForm({ ...form, type: e.target.value, categorie: '' })}
                          style={{ display: 'none' }} />
                        {t === 'entree' ? '↓ Entrée' : '↑ Sortie'}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} required>
                    <option value="">Choisir...</option>
                    {(editing ? (form.type === 'entree' ? catsEntree : catsSortie) : categories).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  placeholder={modalType === 'entree' ? 'Ex: Paiement publicité Canal+' : 'Ex: Paiement salaires du mois'}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              {/* Champ Concerné uniquement pour les entrées */}
              {(editing ? form.type : modalType) === 'entree' && (
                <div className="form-group">
                  <label>👤 Membres de l'équipe concerné(e)s</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {[...membres, 'Autre'].map(p => {
                      const selected = Array.isArray(form.concerne) && form.concerne.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const current = Array.isArray(form.concerne) ? form.concerne : [];
                            const next = selected ? current.filter(x => x !== p) : [...current, p];
                            setForm({ ...form, concerne: next });
                          }}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '20px',
                            border: `2px solid ${selected ? 'var(--success)' : 'var(--border)'}`,
                            background: selected ? '#d5f5e3' : 'white',
                            color: selected ? '#1e8449' : 'var(--text)',
                            fontWeight: selected ? '700' : '400',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {selected ? '✓ ' : ''}{p}
                        </button>
                      );
                    })}
                  </div>
                  {Array.isArray(form.concerne) && form.concerne.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Sélectionné(e)s : <strong>{form.concerne.join(', ')}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Montant (FCFA) *</label>
                <input
                  type="number" min="1" step="any"
                  placeholder="0"
                  value={form.montant}
                  onChange={e => setForm({ ...form, montant: e.target.value })}
                  required
                  style={{ fontSize: '18px', fontWeight: '700' }}
                />
              </div>

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <input
                  placeholder="Informations complémentaires..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button
                  type="submit"
                  className={`btn ${modalType === 'entree' ? 'btn-success' : 'btn-danger'}`}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
