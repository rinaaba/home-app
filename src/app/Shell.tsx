import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import { Icons } from '../core/ui/icons';
import { useTheme } from '../core/ui/theme';
import { ToastProvider } from '../core/ui/toast';
import { sections } from './sections';

export function Shell() {
  const { firstName, user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const showNav = sections.length > 1;

  return (
    <ToastProvider>
    <div className={`shell ${showNav ? 'has-nav' : ''}`}>
      <header className="topbar">
        <div>
          <div className="brand">Home</div>
          <div className="signed-in">
            signed in as {firstName || user?.email} · <button type="button" className="link-btn" onClick={signOut}>sign out</button>
          </div>
        </div>
        <button type="button" className="square-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Icons.sun /> : <Icons.moon />}
        </button>
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
    </ToastProvider>
  );
}
