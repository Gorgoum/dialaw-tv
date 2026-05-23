import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, BookOpen, Users, LogOut,
  Menu, X, Tv, ChevronRight, UsersRound, Tag
} from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['admin', 'comptable'] },
    { path: '/journal', icon: BookOpen, label: 'Entrées / Sorties', roles: ['admin', 'comptable'] },
    { path: '/membres', icon: UsersRound, label: 'Équipe', roles: ['admin'] },
    { path: '/categories', icon: Tag, label: 'Catégories', roles: ['admin'] },
    { path: '/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path;

  // ── MOBILE ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Header mobile */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50, #1a252f)',
          padding: '0 16px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Tv size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', lineHeight: 1.1 }}>Dialaw TV</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>Livre Journal</div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(true)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Menu size={22} />
          </button>
        </div>

        {/* Drawer latéral mobile */}
        {drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
            }} />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px',
              background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)',
              zIndex: 300, display: 'flex', flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            }}>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>Menu</div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              {/* Infos utilisateur */}
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '18px', flexShrink: 0,
                  }}>
                    {user?.nom?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{user?.nom}</div>
                    <span className={`badge badge-${user?.role}`} style={{ fontSize: '11px' }}>
                      {user?.role === 'admin' ? '👑 PDG / Admin' : '📊 Comptable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nav items */}
              <nav style={{ flex: 1, padding: '12px' }}>
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link key={path} to={path} onClick={() => setDrawerOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 12px', borderRadius: '10px', marginBottom: '4px',
                    textDecoration: 'none',
                    color: isActive(path) ? 'white' : 'rgba(255,255,255,0.6)',
                    background: isActive(path) ? 'rgba(192,57,43,0.8)' : 'transparent',
                  }}>
                    <Icon size={20} />
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>{label}</span>
                    {isActive(path) && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
                  </Link>
                ))}
              </nav>

              <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={handleLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 12px', borderRadius: '10px', border: 'none',
                  background: 'rgba(231,76,60,0.2)', color: '#e74c3c',
                  cursor: 'pointer', fontSize: '15px', fontWeight: '600',
                }}>
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </div>
          </>
        )}

        {/* Contenu principal */}
        <div style={{ flex: 1, padding: '16px', paddingBottom: '80px', overflow: 'auto' }}>
          {children}
        </div>

        {/* Barre de navigation en bas */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          zIndex: 100,
        }}>
          {navItems.slice(0, 4).map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '10px 4px',
              textDecoration: 'none',
              color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
              borderTop: isActive(path) ? '2px solid var(--primary)' : '2px solid transparent',
              background: isActive(path) ? '#fff5f5' : 'transparent',
            }}>
              <Icon size={22} />
              <span style={{ fontSize: '10px', marginTop: '3px', fontWeight: isActive(path) ? '700' : '400', textAlign: 'center', lineHeight: 1.2 }}>
                {label.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px',
        background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '72px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #c0392b, #e74c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tv size={20} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', lineHeight: 1.2 }}>Dialaw TV</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Livre Journal</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '10px', marginBottom: '4px',
              textDecoration: 'none',
              color: isActive(path) ? 'white' : 'rgba(255,255,255,0.6)',
              background: isActive(path) ? 'rgba(192,57,43,0.8)' : 'transparent',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
              {isActive(path) && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '8px' }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{user?.nom}</div>
            <span className={`badge badge-${user?.role}`}>
              {user?.role === 'admin' ? '👑 PDG / Admin' : '📊 Comptable'}
            </span>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', border: 'none',
            background: 'rgba(231,76,60,0.2)', color: '#e74c3c',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500',
          }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <div style={{
          background: 'white', padding: '0 28px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #c0392b, #e74c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {user?.nom?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{user?.nom}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'PDG / Admin' : 'Comptable'}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </main>
    </div>
  );
}
