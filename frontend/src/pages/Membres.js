import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Plus, Pencil, Trash2, X, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { nom: '', poste: '' };

export default function Membres() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/membres?tous=1').then(r => setMembres(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ nom: m.nom, poste: m.poste || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/membres/${editing.id}`, { ...form, actif: editing.actif });
        toast.success('Membre modifié');
      } else {
        await api.post('/membres', form);
        toast.success('Membre ajouté');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (m) => {
    try {
      await api.put(`/membres/${m.id}`, { nom: m.nom, poste: m.poste, actif: m.actif ? 0 : 1 });
      toast.success(m.actif ? 'Membre désactivé' : 'Membre réactivé');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Supprimer définitivement "${m.nom}" ?`)) return;
    try {
      await api.delete(`/membres/${m.id}`);
      toast.success('Membre supprimé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const actifs = membres.filter(m => m.actif);
  const inactifs = membres.filter(m => !m.actif);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Équipe Dialaw TV</h1>
          <p className="page-subtitle">{actifs.length} membre(s) actif(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Ajouter un membre
        </button>
      </div>

      {/* Membres actifs */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text)' }}>
          Membres actifs
        </h2>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : actifs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Aucun membre actif. Ajoutez des membres avec le bouton ci-dessus.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {actifs.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '800', fontSize: '18px',
                }}>
                  {m.nom.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{m.nom}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.poste || 'Équipe Dialaw TV'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-sm" style={{ background: '#fef9e7', color: '#7d6608', border: '1px solid #f9e79f' }} onClick={() => toggleActif(m)} title="Désactiver">
                    <UserX size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m)} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membres inactifs */}
      {inactifs.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-muted)' }}>
            Membres inactifs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {inactifs.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', opacity: 0.6 }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
                  background: '#bdc3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '800', fontSize: '18px',
                }}>
                  {m.nom.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{m.nom}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.poste || 'Équipe Dialaw TV'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-sm btn-success" onClick={() => toggleActif(m)} title="Réactiver">
                    <UserCheck size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m)} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier le membre' : 'Ajouter un membre'}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  placeholder="Ex: Amadou Diallo"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Poste / Fonction (optionnel)</label>
                <input
                  placeholder="Ex: Journaliste, Technicien, Présentateur..."
                  value={form.poste}
                  onChange={e => setForm({ ...form, poste: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
