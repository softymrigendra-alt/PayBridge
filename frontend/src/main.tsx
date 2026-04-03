import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '8px', fontSize: '14px' },
          success: { style: { background: '#d1fae5', color: '#065f46' } },
          error: { style: { background: '#fee2e2', color: '#991b1b' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
