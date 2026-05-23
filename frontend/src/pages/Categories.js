import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Plus, Pencil, Trash2, X, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { nom: '', type: 'entree' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [onglet, setOnglet] = useState('entree');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/categories?tous=1').then(r => setCategories(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = (type) => { setEditing(null); setForm({ nom: '', type }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ nom: c.nom, type: c.type, actif: c.actif }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, { ...form, actif: editing.actif });
        toast.success('Catégorie modifiée');
      } else {
        await api.post('/categories', form);
        toast.success('Catégorie ajoutée');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (cat) => {
    try {
      await api.put(`/categories/${cat.id}`, { nom: cat.nom, type: cat.type, actif: cat.actif ? 0 : 1 });
      toast.success(cat.actif ? 'Catégorie désactivée' : 'Catégorie réactivée');
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer "${cat.nom}" ?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success('Catégorie supprimée');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const entrees = categories.filter(c => c.type === 'entree');
  const sorties = categories.filter(c => c.type === 'sortie');
  const affichees = onglet === 'entree' ? entrees : sorties;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catégories</h1>
          <p className="page-subtitle">{entrees.length} entrées · {sorties.length} sorties</p>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate(onglet)}>
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: 'white', borderRadius: '12px', padding: '6px', boxShadow: 'var(--shadow)', width: 'fit-content' }}>
        {[
          { key: 'entree', label: 'Entrées', icon: TrendingDown, color: 'var(--success)', bg: '#d5f5e3' },
          { key: 'sortie', label: 'Sorties', icon: TrendingUp, color: 'var(--danger)', bg: '#fadbd8' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setOnglet(key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: onglet === key ? bg : 'transparent',
            color: onglet === key ? color : 'var(--text-muted)',
            fontWeight: onglet === key ? '700' : '500',
            fontSize: '14px', transition: 'all 0.15s',
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Liste des catégories */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chargement...</div>
      ) : affichees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Aucune catégorie. Cliquez sur "Ajouter" pour en créer une.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {affichees.map(cat => (
            <div key={cat.id} style={{
              background: 'white', borderRadius: '12px', padding: '16px 20px',
              boxShadow: 'var(--shadow)', opacity: cat.actif ? 1 : 0.5,
              display: 'flex', alignItems: 'center', gap: '12px',
              borderLeft: `4px solid ${cat.type === 'entree' ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{cat.nom}</div>
                {!cat.actif && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Désactivée</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(cat)} title="Modifier">
                  <Pencil size={13} />
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => toggleActif(cat)}
                  title={cat.actif ? 'Désactiver' : 'Réactiver'}
                  style={{
                    background: cat.actif ? '#fef9e7' : '#d5f5e3',
                    color: cat.actif ? '#7d6608' : '#1e8449',
                    border: `1px solid ${cat.actif ? '#f9e79f' : '#a9dfbf'}`,
                  }}
                >
                  {cat.actif ? '✕' : '✓'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)} title="Supprimer">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { val: 'entree', label: '↓ Entrée', color: 'var(--success)', bg: '#d5f5e3' },
                    { val: 'sortie', label: '↑ Sortie', color: 'var(--danger)', bg: '#fadbd8' },
                  ].map(({ val, label, color, bg }) => (
                    <button key={val} type="button" onClick={() => setForm({ ...form, type: val })} style={{
                      flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${form.type === val ? color : 'var(--border)'}`,
                      background: form.type === val ? bg : 'white',
                      color: form.type === val ? color : 'var(--text-muted)',
                      fontWeight: '700', fontSize: '14px',
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Nom de la catégorie *</label>
                <input
                  placeholder={form.type === 'entree' ? 'Ex: Vente de spots, Partenariat...' : 'Ex: Carburant, Maintenance...'}
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  required autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
