import { useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import { sections } from './sections';

export function Shell() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const showNav = sections.length > 1;

  return (
    <div className={`shell ${showNav ? 'has-nav' : ''}`}>
      <header className="topbar">
        <span className="brand">Home</span>
        <div className="account">
          <button className="avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Account">
            {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{user?.displayName?.[0] ?? '?'}</span>}
          </button>
          {menuOpen && (
            <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="menu-info">{user?.displayName}<br /><small>{user?.email}</small></div>
              <button onClick={signOut}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      {showNav && (
        <nav className="section-nav">
          {sections.map((s) => (
            <NavLink key={s.id} to={`/${s.path}`} className="section-link">
              <span className="section-icon">{s.icon}</span>
              <span>{s.title}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <main className="content">
        <Routes>
          {sections.map((s) => (
            <Route key={s.id} path={`/${s.path}/*`} element={<s.Component />} />
          ))}
          <Route path="*" element={<Navigate to={`/${sections[0].path}`} replace />} />
        </Routes>
      </main>
    </div>
  );
}
