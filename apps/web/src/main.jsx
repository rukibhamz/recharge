import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { TenantProvider } from './context/TenantContext.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
import './index.css';

const ASSESSMENT_STORAGE_KEY = 'recharge-assessment-v20';

function persistedAssessmentPhase() {
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return 'hero';
    return JSON.parse(raw)?.state?.phase || 'hero';
  } catch {
    return 'hero';
  }
}

function isMidAssessment() {
  const phase = persistedAssessmentPhase();
  return phase && phase !== 'hero' && phase !== 'results';
}

function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.update().catch(() => {});
  });
}

try {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (isMidAssessment()) return;
      updateSW(true);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      registration.update().catch(() => {});
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 1000);
    },
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkServiceWorker();
  });
  window.addEventListener('focus', checkServiceWorker);
  window.addEventListener('pageshow', checkServiceWorker);

  const hadControllerAtLoad = Boolean(navigator.serviceWorker?.controller);
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtLoad) return;
      if (isMidAssessment()) return;
      window.location.reload();
    });
  }
} catch (err) {
  console.warn('Service worker registration skipped:', err);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TenantProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TenantProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
