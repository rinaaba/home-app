import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { HomeMenu } from './HomeMenu';
import { SettingsPage } from './SettingsPage';
import { useAuth } from '../core/auth/AuthProvider';
import { Icons } from '../core/ui/icons';
import { useTheme } from '../core/ui/theme';
import { ToastProvider } from '../core/ui/toast';
import { sections } from './sections';

export function Shell() {
  const { firstName, user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const showNav = sections.length > 1;
  const { pathname } = useLocation();
  const currentSection = sections.find((s) => pathname === `/${s.path}` || pathname.startsWith(`/${s.path}/`));

  return (
    <ToastProvider>
    <div className={`shell ${showNav ? 'has-nav' : ''}`}>
      <header className="topbar">
        <div>
          {/* "Home" takes you to the start of the part you're in (e.g. the gallery). */}
          <Link to={currentSection ? `/${currentSection.path}` : '/'} className="brand">Home</Link>
          <div className="signed-in">
            signed in as {firstName || user?.email} · <button type="button" className="link-btn" onClick={signOut}>sign out</button>
          </div>
        </div>
        <div className="row">
          <button type="button" className="square-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Icons.sun /> : <Icons.moon />}
          </button>
          <Link to="/" className="square-btn" aria-label="Menu"><Icons.all /></Link>
          <Link to="/settings" className="square-btn" aria-label="Settings"><Icons.gear /></Link>
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
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<HomeMenu />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    </ToastProvider>
  );
}
