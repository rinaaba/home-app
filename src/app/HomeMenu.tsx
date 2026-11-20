import { Link } from 'react-router-dom';
import { otherApps, sections } from './sections';

/** The start page: one big button per part of the home app. */
export function HomeMenu() {
  return (
    <div className="page narrow home-menu">
      <h1>What would you like to open?</h1>
      <div className="menu-tiles">
        {sections.map((s) => (
          <Link key={s.id} to={`/${s.path}`} className="menu-tile">
            <span className="menu-icon">{s.icon}</span>
            <span className="menu-title">{s.title}</span>
          </Link>
        ))}
        {otherApps.map((a) => (
          <a key={a.url} href={a.url} className="menu-tile" target="_blank" rel="noreferrer">
            <span className="menu-icon">{a.icon}</span>
            <span className="menu-title">{a.title}</span>
            <span className="meta">{a.note} · opens separately for now</span>
          </a>
        ))}
      </div>
    </div>
  );
}
