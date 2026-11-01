import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppContainer } from './core/AppContainer';

const wsUrl = import.meta.env.VITE_WEBSOCKET_STREAM_URL || 'wss://stream.binance.com:9443/stream';

// Boot the core data engines outside of React
AppContainer.initialize({ wsUrl });

// Clean up connections if the user closes or reloads the browser tab
window.addEventListener('beforeunload', () => {
  AppContainer.teardown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
