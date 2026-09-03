import { TetrisEngine } from '../game/TetrisEngine.ts';
import { renderNavbar } from '../components/navbar.js';
import { getUser, updateLocalUser } from '../services/auth.js';
import api from '../services/api.js';
import { showToast } from '../main.js';
import { getConnectedAddress } from '../web3/wallet.ts';
import { isLemonWebView } from '../web3/lemon.js';
import { t } from '../utils/i18n.js';


import { renderFooter } from '../components/footer.js';
import { setPendingScore, clearPendingScore } from '../services/gameSession.js';

let engine = null;
let gameStartTime = 0;

export function renderPlayPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
      <div class="home-content" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        
        <!-- Game Area Wrapper for Fullscreen -->
        <div id="game-area-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; position: relative; padding: 10px;">
          
          <!-- Fullscreen & Mode Header -->
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 400px; margin-bottom: 8px;" id="game-header-buttons">
            <button class="btn btn-secondary btn-sm" id="btn-back-game" style="gap: var(--space-xs); border-color: rgba(255, 51, 102, 0.4); color: var(--neon-red); box-shadow: 0 0 10px rgba(255, 51, 102, 0.15);">
              ◀ ${t('btnBack')}
            </button>
            <div style="display: flex; gap: 5px;">
              <button class="btn btn-secondary btn-sm" id="btn-quality" style="gap: var(--space-xs); border-color: var(--neon-purple); color: var(--neon-purple); box-shadow: 0 0 10px rgba(188, 19, 254, 0.15);">
                ${localStorage.getItem('frexland_quality') === 'low' ? '⚡ ' + t('qualityLow') : '✨ ' + t('qualityHigh')}
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-fullscreen" style="gap: var(--space-xs); border-color: var(--border-glow); color: var(--neon-cyan); box-shadow: 0 0 10px rgba(0, 245, 255, 0.15);">
                🖥️ ${t('btnFullscreen')}
              </button>
            </div>
          </div>

          <div class="game-section" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
            
            <div class="game-info">
              <div class="game-stat">
                <div class="game-stat-label">${t('gameScore')}</div>
                <div class="game-stat-value" id="stat-score">0</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-label">${t('gameLevel')}</div>
                <div class="game-stat-value" id="stat-level">1</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-label">${t('gameLines')}</div>
                <div class="game-stat-value" id="stat-lines">0</div>
              </div>
            </div>

            <div class="game-layout">
              <div class="game-wrapper" style="position: relative;">
                
                <!-- Mini Audio Player -->
                <div id="mini-audio-player" class="mini-audio-player">
                  <button id="btn-vol-up" style="background: none; border: none; font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; transition: color 0.2s;" title="${t('volUp')}">➕</button>
                  
                  <button id="btn-audio-toggle" style="background: none; border: none; font-size: 1.2rem; color: var(--neon-cyan); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; transition: all 0.2s; text-shadow: 0 0 8px var(--neon-cyan);" title="${t('musicToggle')}">
                    🎵
                  </button>
                  
                  <button id="btn-vol-down" style="background: none; border: none; font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; transition: color 0.2s;" title="${t('volDown')}">➖</button>
                  
                  <a href="https://open.spotify.com/intl-es/artist/6aLrzuqJKxnbfmDIxSzcDb?si=nF7QpgRrQUaWxQUNLCYRmA" target="_blank" title="${t('musicBy')}" style="color: #1DB954; font-size: 1.5rem; text-decoration: none; transition: transform 0.2s; display: flex; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.32 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </a>
                  <audio id="game-audio-track" loop preload="auto">
                    <source src="/assets/audio/musicaTetris.mp3" type="audio/mpeg">
                  </audio>
                </div>

                <div class="game-previews">
                  <div class="game-next">
                    <div class="game-preview-label">${t('gameNext')}</div>
                    <canvas id="next-canvas"></canvas>
                  </div>
                  <div class="game-hold">
                    <div class="game-preview-label">${t('gameHold')} <kbd>C</kbd></div>
                    <canvas id="hold-canvas"></canvas>
                  </div>
                </div>
                
                <div class="game-canvas-container">
                  <canvas id="game-canvas"></canvas>
                  <div class="game-overlay" id="game-overlay">
                    <div class="game-overlay-title text-gradient">⬢ BLOCKDROP</div>
                    <button class="btn btn-primary btn-lg" id="btn-start">▶ ${t('btnStart')}</button>
                    <div class="game-controls-hint">
                      <span class="control-key"><kbd>C</kbd> ${t('ctrlHold')}</span>
                      <span class="control-key"><kbd>P</kbd> ${t('ctrlPause')}</span>
                    </div>
                    <div class="game-controls-hint-mobile">
                      <span class="control-key"><kbd>◀</kbd><kbd>▶</kbd> Mover</span>
                      <span class="control-key"><kbd>↻</kbd> Rotar</span>
                      <span class="control-key"><kbd>▼</kbd> Bajar</span>
                      <span class="control-key"><kbd>⏬</kbd> Drop</span>
                      <span class="control-key"><kbd>⇅</kbd> Hold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile Controls -->
            <div class="game-mobile-controls-block">
              <div class="mobile-ctrl-group-left">
                <button class="mobile-btn-overlay" id="mb-left">◀</button>
                <div class="mobile-action-stack">
                  <button class="mobile-btn-overlay mobile-btn-sm" id="mb-drop" title="${t('ctrlDrop')}">⏬</button>
                  <button class="mobile-btn-overlay" id="mb-down">▼</button>
                </div>
                <button class="mobile-btn-overlay" id="mb-right">▶</button>
              </div>
              <button class="mobile-btn-overlay mobile-btn-pause" id="mb-pause" title="${t('ctrlPause')}">⏸</button>
              <div class="mobile-ctrl-group-right">
                <div class="mobile-action-stack">
                  <button class="mobile-btn-overlay mobile-btn-sm" id="mb-hold" title="${t('ctrlHold')}">⇅</button>
                </div>
                <button class="mobile-btn-overlay mobile-btn-rotate" id="mb-rotate" title="${t('ctrlRotate')}">↻</button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'game');
  setupGame();
  setupFullscreen();
  renderFooter(container.querySelector('.home-page'));
}

function setupFullscreen() {
  const gameWrapper = document.getElementById('game-area-wrapper');
  const btn = document.getElementById('btn-fullscreen');
  if (!gameWrapper || !btn) return;

  const backBtn = document.getElementById('btn-back-game');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/home';
    });
  }

  const qualityBtn = document.getElementById('btn-quality');
  if (qualityBtn) {
    qualityBtn.addEventListener('click', () => {
      let current = localStorage.getItem('frexland_quality') || 'high';
      let next = current === 'high' ? 'low' : 'high';
      localStorage.setItem('frexland_quality', next);
      qualityBtn.innerHTML = next === 'low' ? '⚡ ' + t('qualityLow') : '✨ ' + t('qualityHigh');
      showToast(t('qualityChanged'), 'success');
      // If we want it to apply immediately to an ongoing game, we could reload, 
      // but reloading loses state. We will just tell Renderer to read it.
      if (engine && engine.renderer) {
        engine.renderer.updateQuality();
      }
    });
  }

  const toggleFullscreen = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFullscreen) {
      if (gameWrapper.requestFullscreen) {
        gameWrapper.requestFullscreen().then(() => {
          gameWrapper.classList.add('fullscreen-mode');
          btn.textContent = t('btnFullscreenExit');
        }).catch(err => {
          showToast(`${t('errorFullscreenActive')}${err.message}`, 'error');
        });
      } else if (gameWrapper.webkitRequestFullscreen) {
        // Fallback for Safari (iPad)
        gameWrapper.webkitRequestFullscreen();
        gameWrapper.classList.add('fullscreen-mode');
        btn.textContent = t('btnFullscreenExit');
      } else {
        showToast(t('errorFullscreen'), 'warning');
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  btn.addEventListener('click', toggleFullscreen);

  const onFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFullscreen) {
      gameWrapper.classList.remove('fullscreen-mode');
      btn.innerHTML = '🖥️ ' + t('btnFullscreen');
    }
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  
  // Guard references to remove listeners later
  btn._fullscreenCleanup = () => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
  };
}

function setupGame() {
  const canvas = document.getElementById('game-canvas');
  const nextCanvas = document.getElementById('next-canvas');
  const holdCanvas = document.getElementById('hold-canvas');
  const overlay = document.getElementById('game-overlay');

  if (!canvas || !nextCanvas) return;

  engine = new TetrisEngine(canvas, nextCanvas, holdCanvas);

  engine.onScoreUpdate = (score, level, lines, combo) => {
    const scoreEl = document.getElementById('stat-score');
    const levelEl = document.getElementById('stat-level');
    const linesEl = document.getElementById('stat-lines');
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (levelEl) levelEl.textContent = level;
    if (linesEl) linesEl.textContent = lines;
  };

  engine.onGameOver = async (score, level, lines) => {
    const durationSecs = Math.floor((Date.now() - gameStartTime) / 1000);
    await renderGameOverOverlay(score, level, lines);

    const userWallet = getConnectedAddress();
    
    // Guardar el récord temporalmente en la sesión en vez de enviarlo automáticamente
    const packet = { 
      score, 
      level, 
      linesCleared: lines, 
      duracionPartidaSegundos: durationSecs,
      walletAddress: userWallet,
      // inputs: engine.getInputs(), // (Si tuviéramos un array de inputs para el anti-cheat lo pondríamos acá)
    };
    setPendingScore(packet);
    showToast('Puntaje listo para guardar.', 'info');
  };

  document.getElementById('btn-start')?.addEventListener('click', startGame);

  const audioBtn = document.getElementById('btn-audio-toggle');
  const audioTrack = document.getElementById('game-audio-track');
  const volUpBtn = document.getElementById('btn-vol-up');
  const volDownBtn = document.getElementById('btn-vol-down');
  
  if (audioTrack) {
    // Set initial volume
    audioTrack.volume = 0.5;

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (audioTrack.paused) {
          audioTrack.play();
          audioBtn.textContent = '⏸';
        } else {
          audioTrack.pause();
          audioBtn.textContent = '🎵';
        }
      });
    }

    if (volUpBtn) {
      volUpBtn.addEventListener('click', () => {
        audioTrack.volume = Math.min(1, audioTrack.volume + 0.1);
      });
    }

    if (volDownBtn) {
      volDownBtn.addEventListener('click', () => {
        audioTrack.volume = Math.max(0, audioTrack.volume - 0.1);
      });
    }
  }
}

async function renderGameOverOverlay(score, level, lines) {
  const overlay = document.getElementById('game-overlay');
  if (!overlay) return;

  const user = getUser();
  const credits = user ? (user.creditos_escritura || 0) : 0;
  
  let saveSection = '';
  if (!user) {
    saveSection = `<div style="font-size: 0.85rem; color: var(--neon-red); margin-top: 12px;">${t('playNoLogin')}</div>`;
  } else if (credits <= 0) {
    saveSection = `
      <div style="margin-top: 12px; padding: 12px; background: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.2); border-radius: 8px;">
        <div style="font-size: 0.85rem; color: var(--neon-red); margin-bottom: 8px;">${t('playNoCredits')}</div>
        <button class="btn btn-secondary btn-md" onclick="window.location.hash='#/wallet'" style="width: 100%;">
          ${t('playReloadCredits')}
        </button>
      </div>
    `;
  } else {
    saveSection = `<div style="font-size: 0.85rem; color: var(--neon-cyan); margin-top: 12px; padding: 8px; background: rgba(0, 245, 255, 0.05); border: 1px dashed rgba(0, 245, 255, 0.3); border-radius: 8px; text-align: center;">💾 ${t('playPendingScore')}</div>`;
  }

  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="game-overlay-title" style="color: var(--neon-red);">${t('gameOver')}</div>
    <div class="game-overlay-score">${t('playScorePrefix')} ${score.toLocaleString()}</div>
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">${t('playLevelPrefix')} ${level} • ${lines} ${t('playLinesSuffix')}</div>
    
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 280px; margin: 0 auto;">
      <button class="btn btn-primary btn-lg" id="btn-restart">↻ ${t('btnPlayAgain')}</button>
      ${saveSection}
    </div>
  `;

  document.getElementById('btn-restart')?.addEventListener('click', startGame);
}

function startGame() {
  gameStartTime = Date.now();
  // Automatically trigger browser fullscreen on mobile devices when starting
  if (window.innerWidth <= 768) {
    const gameWrapper = document.getElementById('game-area-wrapper');
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (gameWrapper && !isFullscreen) {
      if (gameWrapper.requestFullscreen) {
        gameWrapper.requestFullscreen().then(() => {
          gameWrapper.classList.add('fullscreen-mode');
          const btn = document.getElementById('btn-fullscreen');
          if (btn) btn.textContent = t('btnFullscreenExit');
        }).catch(err => {
          console.error("Auto-fullscreen failed:", err);
        });
      } else if (gameWrapper.webkitRequestFullscreen) {
        gameWrapper.webkitRequestFullscreen();
        gameWrapper.classList.add('fullscreen-mode');
        const btn = document.getElementById('btn-fullscreen');
        if (btn) btn.textContent = '🚪 Salir';
      }
    }
  }

  const overlay = document.getElementById('game-overlay');
  if (overlay) overlay.classList.add('hidden');
  
  const audio = document.getElementById('game-audio-track');
  if (audio) {
    audio.play().catch(e => console.warn('Autoplay prevented by browser:', e));
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) btn.textContent = '⏸';
  }

  if (engine) engine.start();
}

export function cleanupPlayPage() {
  if (engine) engine.stop();
  const btn = document.getElementById('btn-fullscreen');
  if (btn && btn._fullscreenCleanup) {
    btn._fullscreenCleanup();
  }
  const audio = document.getElementById('game-audio-track');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}
