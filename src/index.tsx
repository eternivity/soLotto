import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Nuclear error handler to completely suppress MetaMask conflicts
window.addEventListener('error', function(event) {
  if (event.error && (
    event.error.message.includes('MetaMask') ||
    event.error.message.includes('ethereum') ||
    event.error.message.includes('Failed to connect') ||
    event.error.message.includes('web3') ||
    event.error.message.includes('chrome-extension') ||
    event.error.message.includes('metamask') ||
    event.error.message.includes('ethereumProvider') ||
    event.error.stack?.includes('metamask') ||
    event.error.stack?.includes('ethereum') ||
    event.error.stack?.includes('chrome-extension') ||
    event.error.stack?.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
  )) {
    console.warn('Wallet conflict detected, ignoring:', event.error.message);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true); // Use capture phase

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && (
    event.reason.message?.includes('MetaMask') ||
    event.reason.message?.includes('ethereum') ||
    event.reason.message?.includes('Failed to connect') ||
    event.reason.message?.includes('web3') ||
    event.reason.message?.includes('chrome-extension') ||
    event.reason.message?.includes('metamask') ||
    event.reason.message?.includes('ethereumProvider') ||
    event.reason.stack?.includes('metamask') ||
    event.reason.stack?.includes('ethereum') ||
    event.reason.stack?.includes('chrome-extension') ||
    event.reason.stack?.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
  )) {
    console.warn('Wallet conflict detected, ignoring:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

// Override console.error to filter MetaMask errors
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('MetaMask') || 
      message.includes('ethereum') || 
      message.includes('Failed to connect') ||
      message.includes('chrome-extension') ||
      message.includes('ethereumProvider') ||
      message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')) {
    console.warn('Wallet conflict detected, ignoring console error:', message);
    return;
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter MetaMask warnings
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('MetaMask') || 
      message.includes('ethereum') || 
      message.includes('Failed to connect') ||
      message.includes('chrome-extension') ||
      message.includes('ethereumProvider') ||
      message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')) {
    return; // Don't log MetaMask warnings at all
  }
  originalConsoleWarn.apply(console, args);
};

// Override console.log to filter MetaMask logs
const originalConsoleLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('MetaMask') || 
      message.includes('ethereum') || 
      message.includes('Failed to connect') ||
      message.includes('chrome-extension') ||
      message.includes('ethereumProvider') ||
      message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')) {
    return; // Don't log MetaMask logs at all
  }
  originalConsoleLog.apply(console, args);
};

// Override window.onerror
window.onerror = function(message, source, lineno, colno, error) {
  if (message && (
    message.toString().includes('MetaMask') ||
    message.toString().includes('ethereum') ||
    message.toString().includes('Failed to connect') ||
    message.toString().includes('chrome-extension') ||
    message.toString().includes('ethereumProvider') ||
    message.toString().includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
  )) {
    console.warn('Wallet conflict detected, ignoring window.onerror:', message);
    return true; // Prevent default error handling
  }
  return false; // Allow other errors to be handled normally
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
