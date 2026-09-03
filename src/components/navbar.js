import { getUser, logout, updateLocalUser } from '../services/auth.js';
import { wrapWithBadge } from './avatarBadge.js';
import { getConnectedAddress, subscribeToAccountChanges } from '../web3/wallet.ts';
import { getUserDepositedBalance } from '../web3/contract.ts';
import { getPendingScore, clearPendingScore, subscribeToScoreChanges } from '../services/gameSession.js';
import { isWorldAppWebView } from '../web3/world.ts';
import { isLemonWebView } from '../web3/lemon.js';
import api from '../services/api.js';
import { showToast } from '../main.js';
import { showInfoModal } from './infoModal.js';
import { t, getLang, setLang } from '../utils/i18n.js';

let navbarWalletUnsub = null;
let navbarScoreUnsub = null;

export function renderNavbar(container, activePage = 'game') {
  const user = getUser();
  if (!user) return;

  const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
  const avatarHtml = user.avatarUrl 
    ? `<img src="${user.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #000; background: var(--bg-secondary);">` 
    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; border: 2px solid #000; color: #fff;">${initial}</div>`;
    
  const platform = isWorldAppWebView() ? 'worldchain' : (isLemonWebView() ? 'lemon' : (user.platform || 'html5'));
  const lang = getLang();

  container.innerHTML = `
    <nav class="navbar" id="main-navbar">
      <div class="navbar-inner" style="gap: 15px;">
        <div class="navbar-logo" id="nav-logo" style="flex: 0 0 auto; display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 10px; font-family: 'Press Start 2P', cursive; color: #ffeb3b; text-shadow: 2px 2px 0 #e91e63; font-size: 1rem;">
            <span class="navbar-logo-icon" style="filter: none; font-size: 1.2rem;">🕹️</span> FREXLAND
          </div>
          <button id="nav-info" style="background: none; border: 1px solid var(--neon-cyan); border-radius: 50%; width: 28px; height: 28px; color: var(--neon-cyan); font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 10px; transition: all 0.2s;" title="¿Cómo funciona?">?</button>
        </div>
        <div class="navbar-nav" style="flex: 1 1 auto; justify-content: center;">
          <button class="navbar-link ${activePage === 'game' || activePage === 'home' ? 'active' : ''}" id="nav-game">🎮 ${t('navGames')}</button>
          
          <button class="navbar-link" id="nav-toggle-registro" style="display: flex; align-items: center; gap: 6px;">
            <span id="nav-registro-indicator" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #666; transition: all 0.3s;"></span>${t('navHistory')}
          </button>

          <button class="navbar-link ${activePage === 'wallet' ? 'active' : ''}" id="nav-wallet">💎 ${t('navWallet')}</button>
          
          <div class="navbar-user" style="position: relative; display: flex; align-items: center;">
            <div id="nav-profile-avatar" style="display: flex; align-items: center; gap: 8px; cursor: pointer;" title="Mi Perfil">
              ${wrapWithBadge(avatarHtml, platform)}
              <span class="navbar-username">${user.username}</span>
            </div>
            <button class="navbar-logout" id="nav-dropdown-btn" title="Menú de opciones" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-secondary); cursor: pointer; font-size: 1.35rem; min-width: 38px; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; margin-left: 12px; padding: 0; transition: all 0.2s; touch-action: manipulation;">⋮</button>
            
            <div id="profile-dropdown" class="profile-dropdown card-glass" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 10px; width: 200px; flex-direction: column; z-index: 100; box-shadow: var(--shadow-glow-purple); background: #131320;">
              <a href="https://frexland-online.gitbook.io/frexland-online-docs/" target="_blank" rel="noopener noreferrer" class="dropdown-item">📄 ${t('linkWhitepaper')}</a>
              <a href="#/notifications" class="dropdown-item">🔔 ${t('notifTitle')}</a>
              <a href="#/contact" class="dropdown-item">✉️ ${t('linkContact')}</a>
              <a href="#/faq" class="dropdown-item">❓ ${t('linkFAQ')}</a>
              <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;"></div>
              <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #a098c4; font-size: 0.9rem;">Idioma / Lang</span>
                <div style="display: flex; gap: 5px;">
                  <button class="lang-btn ${lang === 'es' ? 'active' : ''}" data-lang="es" style="background: ${lang === 'es' ? 'var(--neon-cyan)' : 'transparent'}; color: ${lang === 'es' ? '#000' : '#fff'}; border: 1px solid var(--neon-cyan); border-radius: 4px; padding: 2px 6px; cursor: pointer;">ES</button>
                  <button class="lang-btn ${lang === 'en' ? 'active' : ''}" data-lang="en" style="background: ${lang === 'en' ? 'var(--neon-cyan)' : 'transparent'}; color: ${lang === 'en' ? '#000' : '#fff'}; border: 1px solid var(--neon-cyan); border-radius: 4px; padding: 2px 6px; cursor: pointer;">EN</button>
                </div>
              </div>
              <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;"></div>
              <button id="nav-logout" class="dropdown-item" style="color: var(--neon-pink); text-align: left; width: 100%; background: none; border: none; cursor: pointer;">✕ Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;

  document.getElementById('nav-info')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    showInfoModal(); 
  });
  document.getElementById('nav-logo')?.addEventListener('click', () => { window.location.hash = '#/home'; });
  document.getElementById('nav-game')?.addEventListener('click', () => { 
    const lastGame = localStorage.getItem('last_played_game') || '#/play';
    window.location.hash = lastGame; 
  });
  document.getElementById('nav-wallet')?.addEventListener('click', () => { window.location.hash = '#/wallet'; });
  
  const dropdownBtn = document.getElementById('nav-dropdown-btn');
  const dropdownMenu = document.getElementById('profile-dropdown');
  
  document.getElementById('nav-profile-avatar')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    window.location.hash = '#/profile';
  });

  dropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'flex' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownBtn?.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.style.display = 'none';
    }
  });

  // Language selectors
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newLang = btn.getAttribute('data-lang');
      setLang(newLang);
    });
  });

  document.getElementById('nav-toggle-registro')?.addEventListener('click', () => {
    window.location.hash = '#/registro';
  });

  document.getElementById('nav-logout')?.addEventListener('click', (e) => { 
    e.stopPropagation(); // Prevent trigger navigation to profile
    logout(); 
    window.location.hash = '#/auth'; 
  });

  // --- Auto Sync Deposit for logged in users (even if wallet not actively connected) ---
  if (user && user.walletAddresses && user.walletAddresses.length > 0) {
    const primaryWallet = user.walletAddresses[0];
    getUserDepositedBalance(primaryWallet).then(async (onChainDeposit) => {
      if (onChainDeposit > (user.total_depositado || 0)) {
        try {
          const res = await api.post('/wallet/sync-deposit', { amount: onChainDeposit });
          if (res.synced && res.user) {
            updateLocalUser(res.user);
            const creditsEl = document.getElementById('registro-credits-display');
            if (creditsEl) creditsEl.textContent = `💳 ${res.user.creditos_escritura || 0} Créditos Disponibles`;
            updateButtonState(); // in case we just got credits for pending score
          }
        } catch(e) {
          console.error("Auto-sync error", e);
        }
      }
    }).catch(e => console.error("Error fetching on-chain deposit for auto-sync", e));
  }

  updateNavbarWalletInfo();
  updateButtonState();

  if (!navbarWalletUnsub) {
    navbarWalletUnsub = subscribeToAccountChanges(async (account) => {
      updateNavbarWalletInfo();
      
      // Global wallet validation: only allow unlinked wallets or wallets linked to this user
      if (account.isConnected && account.address) {
        try {
          // Verify if wallet belongs to someone else
          await api.get('/wallet/check/' + account.address);
          
          // Sync deposit automatically
          const onChainDeposit = await getUserDepositedBalance(account.address);
          const user = getUser();
          if (user && onChainDeposit > (user.total_depositado || 0)) {
            const res = await api.post('/wallet/sync-deposit', { amount: onChainDeposit });
            if (res.synced && res.user) {
              updateLocalUser(res.user);
              
              // Refresh credits display if we are on registro
              const creditsEl = document.getElementById('registro-credits-display');
              if (creditsEl) {
                creditsEl.textContent = `💳 ${res.user.creditos_escritura || 0} Créditos Disponibles`;
              }
            }
          }
        } catch (err) {
          if (err.message && err.message.includes('vinculada a otro perfil')) {
            showToast('Esa billetera pertenece a otro perfil. Desconectando...', 'error');
            import('../web3/wallet.ts').then(m => m.disconnectWallet());
          }
        }
      }
    });
  }

  if (!navbarScoreUnsub) {
    navbarScoreUnsub = subscribeToScoreChanges(() => {
      updateButtonState();
    });
  }
}

function updateNavbarWalletInfo() {
  updateButtonState();
}

function updateButtonState() {
  const indicator = document.getElementById('nav-registro-indicator');
  
  if (!indicator) return;

  const scoresObj = getPendingScore();
  let packet = null;
  if (scoresObj && Object.keys(scoresObj).length > 0) {
    packet = scoresObj[Object.keys(scoresObj)[0]];
  }

  if (packet) {
    indicator.style.background = 'var(--neon-green)';
    indicator.style.boxShadow = '0 0 8px var(--neon-green)';
  } else {
    indicator.style.background = '#666';
    indicator.style.boxShadow = 'none';
  }
}

