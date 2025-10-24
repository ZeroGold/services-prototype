import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initializeServices } from './services';
import './index.css';

// Initialize services before rendering
initializeServices()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize services:', error);
    // Show error page
    document.getElementById('root')!.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1>Initialization Error</h1>
        <p>${error.message}</p>
      </div>
    `;
  });
