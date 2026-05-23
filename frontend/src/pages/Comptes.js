import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_LABELS = {
  actif: { label: 'Actif', color: '#d6eaf8', text: '#1a5276' },
  passif: { label: 'Passif', color: '#fef9e7', text: '#7d6608' },
  charge: { label: 'Charge', color: '#fadbd8', text: '#922b21' },
  produit: { label: 'Produit', color: '#d5f5e3', text: '#1e8449' },
};

const EMPTY_FORM = { numero: '', libelle: '', type: 'actif' };

export default function Comptes() {
  const { isAdmin } = useAuth();
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/comptes').then(r => setComptes(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ numero: c.numero, libelle: c.libelle, type: c.type }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/comptes/${editing.id}`, form);
        toast.success('Compte modifié');
      } else {
        await api.post('/comptes', form);
        toast.success('Compte créé');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce compte ?')) return;
    try {
      await api.delete(`/comptes/${id}`);
      toast.success('Compte supprimé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de supprimer');
    }
  };

  const filtered = filterType ? comptes.filter(c => c.type === filterType) : comptes;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Plan Comptable</h1>
          <p className="page-subtitle">{comptes.length} comptes configurés</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nouveau compte
          </button>
        )}
      </div>

      {/* Filtres par type */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!filterType ? 'btn-secondary' : 'btn-outline'}`} onClick={() => setFilterType('')}>
          Tous ({comptes.length})
        </button>
        {Object.entries(TYPE_LABELS).map(([key, val]) => (
          <button
            key={key}
            className={`btn btn-sm ${filterType === key ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterType(filterType === key ? '' : key)}
          >
            {val.label} ({comptes.filter(c => c.type === key).length})
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N° Compte</th>
                <th>Libellé</th>
                <th>Type</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const t = TYPE_LABELS[c.type] || {};
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '15px', color: 'var(--secondary)' }}>{c.numero}</td>
                    <td style={{ fontWeight: '500' }}>{c.libelle}</td>
                    <td>
                      <span style={{ background: t.color, color: t.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {t.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier' : 'Nouveau'} compte</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Numéro de compte *</label>
                <input placeholder="ex: 512" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Libellé *</label>
                <input placeholder="ex: Banque principale" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="actif">Actif</option>
                  <option value="passif">Passif</option>
                  <option value="charge">Charge</option>
                  <option value="produit">Produit</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
