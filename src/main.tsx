import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConfirmProvider } from './components/Confirm';
import { SiteGate } from './components/SiteGate';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteGate>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </SiteGate>
  </StrictMode>,
);
