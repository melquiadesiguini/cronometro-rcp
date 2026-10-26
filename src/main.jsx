import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './AppRoot.jsx';
import { setupUpdates } from './lib/updates.js';
import './styles/global.css';
import './styles/palettes.css';

setupUpdates();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);
