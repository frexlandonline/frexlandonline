import { TetrisEngine } from '../game/TetrisEngine.ts';
import { renderNavbar } from '../components/navbar.js';
import { getUser } from '../services/auth.js';
import { showToast } from '../main.js';
import { getConnectedAddress } from '../web3/wallet.ts';
import { t } from '../utils/i18n.js';
import { renderFooter } from '../components/footer.js';
import { setPendingScore } from '../services/gameSession.js';

let engine = null;
let gameStartTime = 0;

export function renderPlayPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    
    <!-- ─── 1. PRE-GAME LOBBY / PORTADA ─── -->
    <div id="pregame-screen" class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: calc(100vh - 140px); padding: 10px 16px 80px 16px;">
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 480px;">
        
        <!-- Header: Volver y Calidad (SIN botón de pantalla completa) -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 14px;">
          <button class="btn btn-secondary btn-sm" id="btn-back-pregame" style="gap: var(--space-xs); border-color: rgba(255, 51, 102, 0.4); color: var(--neon-red); box-shadow: 0 0 10px rgba(255, 51, 102, 0.15);">
            ◀ ${t('btnBack')}
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-quality-pregame" style="gap: var(--space-xs); border-color: var(--neon-purple); color: var(--neon-purple); box-shadow: 0 0 10px rgba(188, 19, 254, 0.15);">
            ${localStorage.getItem('frexland_quality') === 'low' ? '⚡ ' + t('qualityLow') : '✨ ' + t('qualityHigh')}
          </button>
        </div>

        <!-- Hero Card con imagen de fondo de Tetris -->
        <div class="pregame-hero-card">
          <!-- Título con animación flotante neón -->
          <div class="game-overlay-title text-gradient" style="margin-bottom: 22px; font-size: 2rem; letter-spacing: 0.08em; text-shadow: 0 0 20px rgba(0, 245, 255, 0.6);">
            ⬢ BLOCKDROP
          </div>

          <!-- Botón de Jugar -->
          <button class="btn btn-primary btn-lg" id="btn-start-lobby" style="padding: 14px 44px; font-size: 1.25rem; font-weight: bold; letter-spacing: 0.12em; box-shadow: 0 0 25px rgba(0, 245, 255, 0.5); margin-bottom: 22px;">
            ▶ ${t('btnStart')}
          </button>

          <!-- Guía Explicativa de Controles Grande y Clara -->
          <div class="pregame-controls-guide" style="width: 100%; background: rgba(5, 5, 16, 0.88); border: 1.5px solid rgba(0, 245, 255, 0.3); border-radius: 14px; padding: 18px 16px; box-sizing: border-box; box-shadow: inset 0 0 15px rgba(0, 245, 255, 0.06);">
            
            <!-- Controles Móvil / Táctil -->
            <div style="margin-bottom: 16px;">
              <div style="font-family: var(--font-display); font-size: 0.85rem; color: var(--neon-cyan); letter-spacing: 0.08em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>📱</span> <span>CONTROLES TÁCTILES</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.88rem; color: #fff;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">◀ ▶</span> <span>Mover</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">↻</span> <span>Rotar</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">▼</span> <span>Bajar suave</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">⏬</span> <span>Caída rápida</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">⇅</span> <span>Guardar (Hold)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">⏸</span> <span>Pausar</span>
                </div>
              </div>
            </div>

            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.3), transparent); margin: 14px 0;"></div>

            <!-- Controles PC / Teclado -->
            <div>
              <div style="font-family: var(--font-display); font-size: 0.85rem; color: var(--neon-purple); letter-spacing: 0.08em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>⌨️</span> <span>TECLADO (PC)</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.88rem; color: #fff;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">← →</span> <span>Mover</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">↑</span> <span>Rotar</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">↓</span> <span>Bajar</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">Espacio</span> <span>Drop</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">C</span> <span>Hold</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="guide-kbd">P</span> <span>Pausa</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>

    <!-- ─── 2. PANTALLA DE JUEGO ACTIVO (PANTALLA COMPLETA DEDICADA HASTA LA PUBLICIDAD) ─── -->
    <div id="active-game-screen">
      
      <!-- Barra Superior de Juego Activo -->
      <div id="active-game-header" style="width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; box-sizing: border-box; flex-shrink: 0; z-index: 20;">
        <button class="btn btn-secondary btn-sm" id="btn-exit-game" style="padding: 4px 10px; font-size: 0.8rem; border-color: rgba(255, 51, 102, 0.4); color: var(--neon-red); box-shadow: 0 0 8px rgba(255, 51, 102, 0.2);" title="Salir al menú">
          ◀ ${t('btnBack') || 'Salir'}
        </button>

        <!-- Stats Compactas -->
        <div style="display: flex; gap: 10px; align-items: center; background: rgba(0, 0, 0, 0.7); border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 8px; padding: 3px 12px;">
          <div style="text-align: center;">
            <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase;">Pts</span>
            <div id="stat-score" style="font-family: var(--font-display); font-size: 0.95rem; color: var(--neon-cyan); font-weight: bold; line-height: 1;">0</div>
          </div>
          <div style="color: rgba(255,255,255,0.2);">|</div>
          <div style="text-align: center;">
            <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase;">Niv</span>
            <div id="stat-level" style="font-family: var(--font-display); font-size: 0.95rem; color: var(--neon-yellow); font-weight: bold; line-height: 1;">1</div>
          </div>
          <div style="color: rgba(255,255,255,0.2);">|</div>
          <div style="text-align: center;">
            <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase;">Lín</span>
            <div id="stat-lines" style="font-family: var(--font-display); font-size: 0.95rem; color: var(--neon-green); font-weight: bold; line-height: 1;">0</div>
          </div>
        </div>

        <!-- Mini Audio Player -->
        <div class="mini-audio-player" style="position: static; transform: none; padding: 2px 8px; border-radius: 8px; gap: 6px; background: rgba(0, 0, 0, 0.7); border: 1px solid rgba(0, 245, 255, 0.3); display: flex; align-items: center;">
          <button id="btn-vol-down" style="background: none; border: none; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;" title="${t('volDown')}">➖</button>
          <button id="btn-audio-toggle" style="background: none; border: none; font-size: 1.05rem; color: var(--neon-cyan); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; text-shadow: 0 0 6px var(--neon-cyan);" title="${t('musicToggle')}">🎵</button>
          <button id="btn-vol-up" style="background: none; border: none; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;" title="${t('volUp')}">➕</button>
          <a href="https://open.spotify.com/intl-es/artist/6aLrzuqJKxnbfmDIxSzcDb?si=nF7QpgRrQUaWxQUNLCYRmA" target="_blank" title="${t('musicBy')}" style="color: #1DB954; font-size: 1.1rem; text-decoration: none; display: flex; margin-left: 2px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.32 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </a>
          <audio id="game-audio-track" loop preload="auto">
            <source src="/assets/audio/musicaTetris.mp3" type="audio/mpeg">
          </audio>
        </div>
      </div>

      <!-- Sección Central con Canvas y Previews -->
      <div id="ingame-canvas-section">
        <div class="ingame-game-wrapper">
          
          <!-- Hold Preview Box -->
          <div class="ingame-preview-box ingame-preview-hold">
            <div class="game-preview-label" style="margin-bottom: 2px; font-size: 0.65rem;">HOLD</div>
            <canvas id="hold-canvas"></canvas>
          </div>

          <!-- Canvas Principal -->
          <canvas id="game-canvas"></canvas>

          <!-- Next Preview Box -->
          <div class="ingame-preview-box ingame-preview-next">
            <div class="game-preview-label" style="margin-bottom: 2px; font-size: 0.65rem;">NEXT</div>
            <canvas id="next-canvas"></canvas>
          </div>

          <!-- Overlay Game Over / Pausa -->
          <div class="game-overlay hidden" id="game-overlay"></div>
        </div>
      </div>

      <!-- Controles Táctiles Móviles (Justo encima de la publicidad) -->
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
  `;

  renderNavbar(document.getElementById('navbar-container'), 'game');
  setupLobbyEvents();
  setupGameEngine();
  renderFooter(container.querySelector('.home-page'));
}

function setupLobbyEvents() {
  const backBtn = document.getElementById('btn-back-pregame');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/home';
    });
  }

  const qualityBtn = document.getElementById('btn-quality-pregame');
  if (qualityBtn) {
    qualityBtn.addEventListener('click', () => {
      let current = localStorage.getItem('frexland_quality') || 'high';
      let next = current === 'high' ? 'low' : 'high';
      localStorage.setItem('frexland_quality', next);
      qualityBtn.innerHTML = next === 'low' ? '⚡ ' + t('qualityLow') : '✨ ' + t('qualityHigh');
      showToast(t('qualityChanged'), 'success');
      if (engine && engine.renderer) {
        engine.renderer.updateQuality();
      }
    });
  }

  const startBtn = document.getElementById('btn-start-lobby');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  const exitBtn = document.getElementById('btn-exit-game');
  if (exitBtn) {
    exitBtn.addEventListener('click', exitToLobby);
  }
}

function setupGameEngine() {
  const canvas = document.getElementById('game-canvas');
  const nextCanvas = document.getElementById('next-canvas');
  const holdCanvas = document.getElementById('hold-canvas');

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
    renderGameOverOverlay(score, level, lines);

    const userWallet = getConnectedAddress();
    const packet = { 
      score, 
      level, 
      linesCleared: lines, 
      duracionPartidaSegundos: durationSecs,
      walletAddress: userWallet,
    };
    setPendingScore(packet);
    showToast('Puntaje listo para guardar.', 'info');
  };

  setupAudio();
}

function setupAudio() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  const audioTrack = document.getElementById('game-audio-track');
  const volUpBtn = document.getElementById('btn-vol-up');
  const volDownBtn = document.getElementById('btn-vol-down');
  
  if (audioTrack) {
    audioTrack.volume = 0.5;

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (audioTrack.paused) {
          audioTrack.play().catch(() => {});
          audioBtn.textContent = '⏸';
        } else {
          audioTrack.pause();
          audioBtn.textContent = '🎵';
        }
      });
    }

    if (volUpBtn) {
      volUpBtn.addEventListener('click', () => {
        audioTrack.volume = Math.min(1, Number((audioTrack.volume + 0.1).toFixed(1)));
      });
    }

    if (volDownBtn) {
      volDownBtn.addEventListener('click', () => {
        audioTrack.volume = Math.max(0, Number((audioTrack.volume - 0.1).toFixed(1)));
      });
    }
  }
}

export function startGame() {
  gameStartTime = Date.now();

  const pregame = document.getElementById('pregame-screen');
  const activeScreen = document.getElementById('active-game-screen');
  const navbar = document.getElementById('main-navbar');
  const footer = document.querySelector('footer') || document.querySelector('.footer');
  const adBanner = document.getElementById('web3-ad-container');

  if (pregame) pregame.style.display = 'none';
  if (navbar) navbar.style.display = 'none';
  if (footer) footer.style.display = 'none';

  if (adBanner) {
    adBanner.style.display = 'block';
    const adHeight = adBanner.offsetHeight || 68;
    if (activeScreen) activeScreen.style.bottom = `${adHeight}px`;
  }

  if (activeScreen) {
    activeScreen.style.display = 'flex';
  }

  // Prevent background scrolling while playing
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  // Hide any game-over overlay
  const overlay = document.getElementById('game-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  // Play audio
  const audio = document.getElementById('game-audio-track');
  const audioBtn = document.getElementById('btn-audio-toggle');
  if (audio) {
    audio.play().catch(e => console.warn('Autoplay prevented:', e));
    if (audioBtn) audioBtn.textContent = '⏸';
  }

  // Reset stats display
  const scoreEl = document.getElementById('stat-score');
  const levelEl = document.getElementById('stat-level');
  const linesEl = document.getElementById('stat-lines');
  if (scoreEl) scoreEl.textContent = '0';
  if (levelEl) levelEl.textContent = '1';
  if (linesEl) linesEl.textContent = '0';

  if (engine) {
    engine.start();
  }
}

export function exitToLobby() {
  if (engine) {
    engine.stop();
  }

  const audio = document.getElementById('game-audio-track');
  const audioBtn = document.getElementById('btn-audio-toggle');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    if (audioBtn) audioBtn.textContent = '🎵';
  }

  const pregame = document.getElementById('pregame-screen');
  const activeScreen = document.getElementById('active-game-screen');
  const navbar = document.getElementById('main-navbar');
  const footer = document.querySelector('footer') || document.querySelector('.footer');

  if (activeScreen) activeScreen.style.display = 'none';
  if (pregame) pregame.style.display = 'flex';
  if (navbar) navbar.style.display = '';
  if (footer) footer.style.display = '';

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

function renderGameOverOverlay(score, level, lines) {
  const overlay = document.getElementById('game-overlay');
  if (!overlay) return;

  const user = getUser();
  const credits = user ? (user.creditos_escritura || 0) : 0;
  
  let saveSection = '';
  if (!user) {
    saveSection = `<div style="font-size: 0.85rem; color: var(--neon-red); margin-top: 10px;">${t('playNoLogin')}</div>`;
  } else if (credits <= 0) {
    saveSection = `
      <div style="margin-top: 10px; padding: 10px; background: rgba(255, 51, 102, 0.1); border: 1px solid rgba(255, 51, 102, 0.3); border-radius: 8px;">
        <div style="font-size: 0.82rem; color: var(--neon-red); margin-bottom: 6px;">${t('playNoCredits')}</div>
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/wallet'" style="width: 100%;">
          ${t('playReloadCredits')}
        </button>
      </div>
    `;
  } else {
    saveSection = `<div style="font-size: 0.82rem; color: var(--neon-cyan); margin-top: 10px; padding: 8px; background: rgba(0, 245, 255, 0.08); border: 1px dashed rgba(0, 245, 255, 0.35); border-radius: 8px; text-align: center;">💾 ${t('playPendingScore')}</div>`;
  }

  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="game-overlay-title" style="color: var(--neon-red); font-size: 1.8rem; margin-bottom: 4px;">${t('gameOver')}</div>
    <div class="game-overlay-score" style="font-size: 1.3rem; margin-bottom: 2px;">${t('playScorePrefix')} ${score.toLocaleString()}</div>
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">${t('playLevelPrefix')} ${level} • ${lines} ${t('playLinesSuffix')}</div>
    
    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 260px; margin: 0 auto;">
      <button class="btn btn-primary btn-md" id="btn-restart" style="width: 100%; font-weight: bold; letter-spacing: 0.05em;">
        ↻ ${t('btnPlayAgain')}
      </button>
      <button class="btn btn-secondary btn-md" id="btn-overlay-exit" style="width: 100%;">
        ◀ Volver al Menú
      </button>
      ${saveSection}
    </div>
  `;

  document.getElementById('btn-restart')?.addEventListener('click', startGame);
  document.getElementById('btn-overlay-exit')?.addEventListener('click', exitToLobby);
}

export function cleanupPlayPage() {
  if (engine) {
    engine.stop();
    engine = null;
  }
  const audio = document.getElementById('game-audio-track');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  const navbar = document.getElementById('main-navbar');
  const footer = document.querySelector('footer') || document.querySelector('.footer');
  if (navbar) navbar.style.display = '';
  if (footer) footer.style.display = '';
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

// Fullscreen helpers for backward compatibility
export function enterFullscreenMode() {
  startGame();
}

export function exitFullscreenMode() {
  exitToLobby();
}
