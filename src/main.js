import './styles/index.css';
import './styles/auth.css';
import './styles/game.css';
import './styles/wallet.css';
import './styles/landing.css';

import { renderAuthPage } from './views/auth.js';
import { renderFrexlandPage, cleanupFrexlandPage } from './views/frexland.js';
import { renderBlockdropPage, cleanupBlockdropPage } from './views/blockdrop.js';
import { renderPlayPage, cleanupPlayPage } from './views/play.js';
import { renderWalletPage } from './views/wallet.js';
import { renderProfilePage } from './views/profile.js';
import { renderContactPage } from './views/contact.js';
import { renderNotificationsPage } from './views/notifications.js';
import { renderWhitepaperPage } from './views/whitepaper.js';
import { renderFaqPage } from './views/faq.js';
import { renderRegistroPage } from './views/registro.js';
import { renderLandingPage } from './views/landing.js';
import { isLoggedIn, fetchCurrentUser, getUser, logout } from './services/auth.js';
import { checkAndShowTermsModal } from './components/termsModal.js';
import { showInfoModal } from './components/infoModal.js';
import { checkAndShowWinnerModal } from './components/winnerModal.js';
import { MiniKit } from '@worldcoin/minikit-js';

const app = document.getElementById('app');

// ─── Toast System ────────────────────────────────────────
let toastContainer = null;

export function showToast(message, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}

// ─── Router ──────────────────────────────────────────────
let currentCleanup = null;

function navigate() {
  // Run cleanup of previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const hash = window.location.hash || '#/';
  const route = hash.replace('#', '');

  const loggedIn = isLoggedIn();
  const user = getUser();
  const isEmailVerified = !user || user.emailVerified;

  // Public routes that anyone can access (no login required)
  const publicRoutes = ['/auth', '/', '/landing', '/faq', '/contact', '/whitepaper'];

  // Auth & verification guard
  if (!publicRoutes.includes(route)) {
    if (!loggedIn) {
      window.location.hash = '#/';
      return;
    }
    if (!isEmailVerified && route !== '/verify') {
      window.location.hash = '#/verify';
      return;
    }
  }

  // Redirect verified logged-in users from auth and landing
  if ((route === '/auth' || route === '/' || route === '/landing') && loggedIn && isEmailVerified) {
    window.location.hash = '#/home';
    return;
  }

  // Terms and conditions acceptance guard
  if (!publicRoutes.includes(route) && route !== '/registro' && loggedIn && isEmailVerified) {
    if (localStorage.getItem('blockdrop_hide_info') !== 'true') {
      showInfoModal();
    }
    checkAndShowTermsModal();
  }

  // Theme Guard
  if (route === '/blockdrop' || route === '/play') {
    document.body.classList.remove('frexland-theme');
  } else {
    document.body.classList.add('frexland-theme');
  }

  // Ad Banner Guard
  const adContainer = document.getElementById('web3-ad-container');
  if (adContainer) {
    adContainer.style.display = 'block';
    document.body.style.paddingBottom = '60px';
  }

  switch (route) {
    case '/':
    case '/landing':
      renderLandingPage(app);
      break;
    case '/auth':
      renderAuthPage(app);
      break;
    case '/registro':
      renderRegistroPage(app);
      break;
    case '/home':
      renderFrexlandPage(app);
      currentCleanup = cleanupFrexlandPage;
      break;
    case '/blockdrop':
      renderBlockdropPage(app);
      currentCleanup = cleanupBlockdropPage;
      break;
    case '/play':
      renderPlayPage(app);
      currentCleanup = cleanupPlayPage;
      break;
    case '/wallet':
      renderWalletPage(app);
      break;
    case '/profile':
      renderProfilePage(app);
      break;
    case '/contact':
      renderContactPage(app);
      break;
    case '/notifications':
      renderNotificationsPage(app);
      break;
    case '/whitepaper':
      renderWhitepaperPage(app);
      break;
    case '/faq':
      renderFaqPage(app);
      break;
    default:
      window.location.hash = isLoggedIn() ? '#/home' : '#/';
  }
}

// ─── Init ────────────────────────────────────────────────
async function init() {
  // Validate session if token exists
  if (isLoggedIn()) {
    try {
      await fetchCurrentUser();
      checkAndShowWinnerModal();
    } catch (e) {
      // Token invalid, redirect to auth
    }
  }

  window.addEventListener('hashchange', navigate);
  navigate();
}

// ─── Idle Timer (10 minutes) ────────────────────────────────────
let idleTimeout;
const IDLE_TIME_MS = 10 * 60 * 1000; // 10 minutes

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  if (isLoggedIn()) {
    idleTimeout = setTimeout(() => {
      logout();
      showToast('Sesión cerrada por inactividad.', 'warning');
      window.location.hash = '#/';
    }, IDLE_TIME_MS);
  }
}

// Listen to user activity
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, resetIdleTimer);
});

// Init World App SDK if available
try {
  MiniKit.install('app_16b6ce75c2caa92d0fd4d4e1f42cc2f6');
} catch (e) {
  console.warn("MiniKit no instalado o no soportado en este entorno.");
}

// Setup initial timer if already logged in on load
window.addEventListener('load', resetIdleTimer);

init();
