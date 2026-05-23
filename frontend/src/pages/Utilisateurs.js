import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Plus, Pencil, UserX, X, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { nom: '', email: '', password: '', role: 'comptable', actif: 1 };

export default function Utilisateurs() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ nom: u.nom, email: u.email, password: '', role: u.role, actif: u.actif });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;

      if (editing) {
        await api.put(`/users/${editing.id}`, data);
        toast.success('Utilisateur modifié');
      } else {
        await api.post('/users', data);
        toast.success('Utilisateur créé');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (u) => {
    if (u.id === currentUser.id) return toast.error('Impossible de désactiver votre propre compte');
    if (!window.confirm(`Désactiver ${u.nom} ?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('Utilisateur désactivé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">{users.length} utilisateur(s) dans le système</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Ajouter un utilisateur
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.actif ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: u.role === 'admin' ? 'linear-gradient(135deg, #c0392b, #e74c3c)' : 'linear-gradient(135deg, #2980b9, #3498db)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '14px',
                      }}>
                        {u.nom.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '600' }}>{u.nom}</span>
                      {u.id === currentUser.id && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(vous)</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>
                      {u.role === 'admin' ? <><Shield size={12} style={{ marginRight: '4px' }} />PDG / Admin</> : '📊 Comptable'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: u.actif ? '#d5f5e3' : '#f2f3f4',
                      color: u.actif ? '#1e8449' : '#7f8c8d',
                    }}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} title="Modifier">
                        <Pencil size={14} />
                      </button>
                      {u.id !== currentUser.id && u.actif === 1 && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDisable(u)} title="Désactiver">
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier' : 'Nouvel'} utilisateur</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom complet *</label>
                <input placeholder="Prénom et nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" placeholder="email@dialawtv.sn" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{editing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                    style={{ paddingRight: '42px' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Rôle *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="comptable">Comptable</option>
                    <option value="admin">PDG / Admin</option>
                  </select>
                </div>
                {editing && (
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={form.actif} onChange={e => setForm({ ...form, actif: parseInt(e.target.value) })}>
                      <option value={1}>Actif</option>
                      <option value={0}>Inactif</option>
                    </select>
                  </div>
                )}
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
