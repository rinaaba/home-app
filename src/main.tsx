import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './core/ui/theme'; // set light/dark before anything renders
import { keepAppUpdated } from './core/updates';

keepAppUpdated();
import { isConfigured } from './core/firebase/config';

const root = createRoot(document.getElementById('root')!);

if (!isConfigured) {
  root.render(
    <div className="center-page">
      <div className="card signin">
        <h1>Almost there</h1>
        <p>Paste your Firebase settings into <code>src/core/firebase/config.ts</code> (see docs/SETUP.md, step 4).</p>
      </div>
    </div>,
  );
} else {
  // Imported lazily so Firebase only starts once the settings are filled in.
  import('./app/App').then(({ App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
}
