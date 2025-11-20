// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// No need to import addAuthHeader because api.js interceptor reads token from localStorage automatically.
// If a token is present it will be attached to outgoing requests.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
