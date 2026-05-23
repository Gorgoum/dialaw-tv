import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { Tv, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`Bienvenue, ${res.data.user.nom} !`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 50%, #922b21 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(192,57,43,0.4)',
          }}>
            <Tv size={40} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '800', margin: '0 0 4px' }}>
            Dialaw TV
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
            Système de Gestion Comptable
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
            Connexion
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
            Entrez vos identifiants pour accéder au système
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            <strong>Comptes de démonstration :</strong><br />
            👑 Admin : admin@dialawtv.sn / admin2024<br />
            📊 Comptable : comptable@dialawtv.sn / comptable2024
          </div>
        </div>
      </div>
    </div>
  );
}
