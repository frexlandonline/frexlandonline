import { t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { getUser, updateLocalUser } from '../services/auth.js';
import { getPendingScore, clearPendingScore } from '../services/gameSession.js';
import { showToast } from '../main.js';
import api from '../services/api.js';
import { renderFooter } from '../components/footer.js';

import { getConnectedAddress, subscribeToAccountChanges } from '../web3/wallet.ts';

let registroWalletUnsub = null;

export function renderRegistroPage(container) {
  const user = getUser();
  const credits = user?.creditos_escritura || 0;
  const connectedAddress = getConnectedAddress();

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="page-content" style="padding: 100px 20px 20px 20px; max-width: 800px; margin: 0 auto; min-height: 80vh;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <h2 style="font-family: var(--font-display); color: #fff; margin: 0; text-transform: uppercase;">
          ${t('histTitle')}
        </h2>
        <div id="registro-credits-display" style="background: rgba(0, 245, 255, 0.1); border: 1px solid rgba(0, 245, 255, 0.4); padding: 8px 16px; border-radius: 8px; color: var(--neon-cyan); font-weight: bold; display: ${connectedAddress ? 'block' : 'none'};">
          💳 <span id="registro-credits-count">${credits}</span> ${t('histCredits')}
        </div>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 30px;">
        ${t('histDesc')}
      </p>
      
      <div id="registro-list" style="display: flex; flex-direction: column; gap: 15px;">
        <!-- Lista dinámica -->
      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'profile');
  renderList();
  renderFooter(container);

  if (!registroWalletUnsub) {
    registroWalletUnsub = subscribeToAccountChanges((account) => {
      const creditsEl = document.getElementById('registro-credits-display');
      if (creditsEl) {
        if (account.isConnected && account.address) {
          creditsEl.style.display = 'block';
          // Force refresh of user to get latest credits
          import('../services/auth.js').then(({ fetchCurrentUser }) => {
            fetchCurrentUser().then(freshUser => {
              const countEl = document.getElementById('registro-credits-count');
              if (countEl) countEl.textContent = freshUser?.creditos_escritura || 0;
            }).catch(console.error);
          });
        } else {
          creditsEl.style.display = 'none';
        }
      }
    });
  }
}

function renderList() {
  const container = document.getElementById('registro-list');
  const scoresObj = getPendingScore();
  
  if (!scoresObj || Object.keys(scoresObj).length === 0) {
    container.innerHTML = `
      <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 10px; text-align: center; color: var(--text-muted);">
        ${t('histEmpty')}
      </div>
    `;
    return;
  }
  
  // Filter out invalid entries and keep only the latest per gameId
  const rawGames = Object.values(scoresObj).filter(g => g && typeof g === 'object');
  const gamesByGameId = {};
  
  rawGames.forEach(game => {
    const id = game.gameId || 'blockdrop';
    if (!gamesByGameId[id] || (game.timestamp > (gamesByGameId[id].timestamp || 0))) {
      gamesByGameId[id] = game;
    }
  });

  // Sort by timestamp descending
  const games = Object.values(gamesByGameId).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  container.innerHTML = games.map(game => {
    if (!game) return '';
    const gameName = game.gameId === 'snake' ? 'Crypto Snake' : 'BlockDrop';
    const date = game.timestamp ? new Date(game.timestamp).toLocaleString() : t('histDateUnknown');
    const scoreVal = game.score !== undefined ? game.score : (game.puntaje || 0);
    const levelVal = game.level || 1;
    const linesVal = game.linesCleared || 0;
    
    return `
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 15px 20px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <h3 style="margin: 0; color: var(--neon-cyan); font-family: var(--font-display); font-size: 1.2rem;">${gameName}</h3>
          <span style="color: var(--text-muted); font-size: 0.8rem;">${date}</span>
          <div style="color: #fff; margin-top: 5px;">
            <strong style="color: var(--neon-purple); font-size: 1.1rem;">${Number(scoreVal).toLocaleString()} pts</strong> 
            <span style="color: var(--text-secondary); font-size: 0.9rem;">(${t('histLevel')} ${levelVal} | ${linesVal} ${t('histLines')})</span>
          </div>
        </div>
        
        <button class="btn btn-primary save-btn" data-game="${game.gameId || 'blockdrop'}" style="min-width: 200px;">
          ${t('histSaveBtn')}
        </button>
      </div>
      `;
  }).join('');
  
  // Add event listeners
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const gameId = e.target.getAttribute('data-game');
      const packet = scoresObj[gameId];
      if (!packet) return;
      
      const originalText = e.target.innerText;
      e.target.innerText = t('histSaving');
      e.target.disabled = true;
      
      try {
        const res = await api.post('/scores', packet);
        
        const currentUser = getUser();
        if (currentUser) {
           currentUser.creditos_escritura = Math.max(0, (currentUser.creditos_escritura || 0) - 1);
           if (packet.score > (currentUser.high_score || 0)) {
             currentUser.high_score = packet.score;
           }
           updateLocalUser(currentUser);
        }

        showToast(t('histSuccess'), 'success');
        clearPendingScore(gameId);
        
        // Update header credits display
        const creditsEl = document.getElementById('registro-credits-display');
        const countEl = document.getElementById('registro-credits-count');
        if (creditsEl && countEl && currentUser && getConnectedAddress()) {
          countEl.textContent = currentUser.creditos_escritura || 0;
        }

        // Refresh list
        renderList();
      } catch (err) {
        e.target.innerText = originalText;
        e.target.disabled = false;
        
        if (err.message.includes('créditos')) {
          showToast(t('histNoCredits'), 'error');
        } else {
          showToast(err.message || t('histError'), 'error');
        }
      }
    });
  });
}


