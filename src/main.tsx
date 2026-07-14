import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Temporary global error handlers for debugging crashes
window.onerror = function (message, source, lineno, colno, error) {
  const details = {
    message,
    source,
    lineno,
    colno,
    errorObj: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error as any)
    } : null
  };
  alert(`🔴 GLOBAL ERROR CAUGHT:\nMessage: ${message}\nSource: ${source}:${lineno}:${colno}\nError Details: ${JSON.stringify(details, null, 2)}`);
  return false;
};

window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const details = {
    message: reason?.message || String(reason),
    stack: reason?.stack || 'N/A',
    raw: reason
  };
  alert(`🔴 UNHANDLED PROMISE REJECTION:\nMessage: ${details.message}\nStack: ${details.stack}\nRaw: ${JSON.stringify(reason, null, 2) || String(reason)}`);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

