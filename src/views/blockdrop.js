import { renderNavbar } from '../components/navbar.js';
import { t } from '../utils/i18n.js';
import { getUser } from '../services/auth.js';
import { getAvatarBadge, wrapWithBadge } from '../components/avatarBadge.js';
import api from '../services/api.js';
import { fetchLeaderboard, getLeaderboardMeta, fetchGlobalLeaderboard } from '../components/leaderboard.js';
import { showToast } from '../main.js';
import { renderFooter } from '../components/footer.js';
import { getAaveFinancialData } from '../web3/contract.ts';
import { getUserLevel, renderLevelBadge } from '../utils/levels.js';
import { getPendingScore } from '../services/gameSession.js';

let poolInterval;
let countdownInterval;

export function cleanupBlockdropPage() {
  if (poolInterval) clearInterval(poolInterval);
  if (countdownInterval) clearInterval(countdownInterval);
}

export async function renderBlockdropPage(container) {
  cleanupBlockdropPage();

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-bottom: var(--space-2xl);">
      <div class="home-content" style="max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: var(--space-xl); align-items: center; padding: var(--space-md); box-sizing: border-box;">
        
        <div style="text-align: center; margin-top: var(--space-sm); width: 100%;">
          <h1 class="text-gradient text-glow" style="font-family: var(--font-display); font-size: clamp(1.5rem, 6.5vw, 2.6rem); letter-spacing: 2px; margin-bottom: 6px; animation: float 3s ease-in-out infinite;">
            ⬢ BLOCKDROP
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 560px; margin: 0 auto; line-height: 1.4;">
            ${t('bdSubtitle')}
          </p>
        </div>

        <!-- Dashboard Loader -->
        <div id="dashboard-loader" style="display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: 40px 10px;">
          <div class="spinner"></div>
          <span style="color: var(--text-secondary); font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1px;">${t('bdLoadingBoard')}</span>
        </div>

        <!-- Dashboard Content (hidden initially) -->
        <div id="dashboard-main-content" class="hidden" style="width: 100%; display: flex; flex-direction: column; gap: var(--space-lg); align-items: center;">

          <!-- TAB SWITCHER: TABLA DE COMPETENCIA vs TABLA GLOBAL INFORMATIVA -->
          <div style="display: flex; gap: 8px; width: 100%; max-width: 620px; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-sizing: border-box;">
            <button type="button" id="tab-btn-competition" class="btn btn-primary" style="flex: 1; font-family: var(--font-display); font-size: clamp(0.7rem, 2.6vw, 0.82rem); padding: 10px 8px; border-radius: 8px;">
              🏆 Torneo Semanal (Premios)
            </button>
            <button type="button" id="tab-btn-global" class="btn btn-secondary" style="flex: 1; font-family: var(--font-display); font-size: clamp(0.7rem, 2.6vw, 0.82rem); padding: 10px 8px; border-radius: 8px;">
              🌍 Tabla Global (Informativa)
            </button>
          </div>
          
          <!-- TAB 1: COMPETITION PODIUM & DYNAMIC SLOTS SECTION -->
          <div id="section-competition-board" class="card card-glass" style="width: 100%; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-md); box-sizing: border-box;">
            <div style="text-align: center; width: 100%;">
              <h2 style="font-family: var(--font-display); font-size: clamp(1.1rem, 4.5vw, 1.4rem); color: #fff; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                🏆 ${t('bdPodiumTitle')}
              </h2>
              <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 2px;">
                Los puntajes inscritos con créditos compiten por el 70% de los intereses semanales de Aave V3.
              </p>
            </div>

            <!-- Visual Podium Columns -->
            <div class="podium-container">
              
              <!-- 2ND PLACE (30%) -->
              <div class="podium-col podium-step-2" id="podium-2nd">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">🥈</div>
                  <img id="podium-img-2nd" src="" class="podium-avatar">
                  <div id="podium-badge-2nd" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-2nd">-</div>
                <div id="podium-level-2nd" style="margin-bottom: 2px;"></div>
                <div class="podium-score" id="podium-score-2nd">- pts</div>
                <div class="podium-step-body" style="height: 120px;">
                  <span class="podium-step-num">2</span>
                </div>
              </div>

              <!-- 1ST PLACE (50%) -->
              <div class="podium-col podium-step-1" id="podium-1st">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">👑</div>
                  <img id="podium-img-1st" src="" class="podium-avatar">
                  <div id="podium-badge-1st" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-1st">-</div>
                <div id="podium-level-1st" style="margin-bottom: 2px;"></div>
                <div class="podium-score" id="podium-score-1st">- pts</div>
                <div class="podium-step-body" style="height: 160px; border-color: rgba(255, 215, 0, 0.45); box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);">
                  <span class="podium-step-num">1</span>
                </div>
              </div>

              <!-- 3RD PLACE (10%) -->
              <div class="podium-col podium-step-3" id="podium-3rd">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">🥉</div>
                  <img id="podium-img-3rd" src="" class="podium-avatar">
                  <div id="podium-badge-3rd" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-3rd">-</div>
                <div id="podium-level-3rd" style="margin-bottom: 2px;"></div>
                <div class="podium-score" id="podium-score-3rd">- pts</div>
                <div class="podium-step-body" style="height: 90px;">
                  <span class="podium-step-num">3</span>
                </div>
              </div>

            </div>

            <!-- Dynamic +10 Slots Expansion Banner & Progress -->
            <div id="slots-expansion-banner" style="width: 100%; max-width: 560px; background: rgba(0, 245, 255, 0.05); border: 1px dashed rgba(0, 245, 255, 0.35); border-radius: 10px; padding: 12px 14px; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">
                <span id="slots-expansion-title" style="font-family: var(--font-display); font-size: 0.76rem; color: var(--neon-cyan); font-weight: bold;">
                  🔓 Puestos de Recompensa Activos: Solo Top 3 (1°, 2° y 3°)
                </span>
                <span id="slots-expansion-badge" style="font-size: 0.7rem; background: rgba(57, 255, 20, 0.12); border: 1px solid rgba(57, 255, 20, 0.4); color: var(--neon-green); padding: 2px 8px; border-radius: 12px; font-weight: bold;">
                  Meta +10 Puestos: 3° Puesto &gt; 10 USDC
                </span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; margin-bottom: 6px;">
                <div id="slots-expansion-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green)); transition: width 0.3s ease;"></div>
              </div>
              <div id="slots-expansion-desc" style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4;">
                Al principio solo se reparte entre los <strong>3 primeros puestos</strong>. Cuando el premio del <strong>3° Puesto supere 10.00 USDC</strong>, se habilitarán los primeros <strong>10 puestos siguientes (4° al 13°)</strong>, y cuando estos lleguen a 10 USDC se abrirán los siguientes 10 sucesivamente.
              </div>
            </div>

            <!-- Leaderboard Table (Ranks 4 to unlockedSlots) -->
            <div style="width: 100%; max-width: 560px; margin-top: var(--space-xs); border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: var(--space-sm);">
              <h3 id="secondary-positions-header" style="font-family: var(--font-display); font-size: 0.85rem; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: var(--space-xs); text-align: center;">
                🔒 Puestos Siguientes (Se habilitan los primeros 10 cuando el 3° Puesto &gt; 10 USDC)
              </h3>
              <div id="leaderboard-table-container" style="display: flex; flex-direction: column; gap: 5px; max-height: 420px; overflow-y: auto; padding-right: 2px;">
                <!-- Dynamically populated rows including Vacante slots -->
              </div>
            </div>

          </div>

          <!-- TAB 2: GLOBAL INFORMATIVE LEADERBOARD (Usuario - Puntaje - Rango) -->
          <div id="section-global-board" class="card card-glass hidden" style="width: 100%; border: 1.5px solid var(--neon-cyan); box-shadow: var(--shadow-neon-cyan); display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-md); box-sizing: border-box;">
            <div style="text-align: center; width: 100%;">
              <h2 style="font-family: var(--font-display); font-size: clamp(1.1rem, 4.5vw, 1.4rem); color: var(--neon-cyan); letter-spacing: 1px;">
                🌍 Tabla Global de Puntos — BlockDrop
              </h2>
              <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px; max-width: 540px; margin-left: auto; margin-right: auto;">
                Ranking histórico e informativo con el <strong>mayor puntaje de cada jugador</strong> en BlockDrop (incluye jugadores Sin Rango sin gastar créditos).
              </p>
            </div>

            <!-- Header Columns: Usuario | Rango | Puntaje -->
            <div style="width: 100%; max-width: 600px; display: grid; grid-template-columns: 42px 1fr 120px 100px; align-items: center; padding: 8px 12px; background: rgba(0, 245, 255, 0.08); border-radius: 8px; font-family: var(--font-display); font-size: 0.72rem; color: var(--neon-cyan); text-transform: uppercase; box-sizing: border-box;">
              <span>#</span>
              <span>Usuario</span>
              <span style="text-align: center;">Rango</span>
              <span style="text-align: right;">Puntaje</span>
            </div>

            <div id="global-leaderboard-container" style="width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 5px; max-height: 480px; overflow-y: auto;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- REWARD POOL SECTION -->
          <div class="card" style="width: 100%; border: 1.5px solid var(--border-glow); display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-md); box-sizing: border-box;">
            <div style="text-align: center; width: 100%;">
              <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;">
                💰 ${t('bdRewardPool')} (70% Intereses Semanales)
              </span>
              <div id="prize-pool-total" style="font-family: var(--font-display); font-size: clamp(1.3rem, 5.5vw, 2.2rem); font-weight: 900; color: var(--neon-green); text-shadow: 0 0 15px rgba(0, 255, 136, 0.4); margin: 6px 0; word-break: break-all;">
                0.00 USDC
              </div>
              <p style="color: var(--text-muted); font-size: 0.78rem; max-width: 520px; margin: 0 auto; line-height: 1.35;">
                El 70% de los intereses generados en Aave V3 se reparte entre los juegos proporcionalmente a sus grabaciones de puntaje, y el 30% se destina al proyecto al finalizar cada semana.
              </p>
              <div id="weekly-countdown" style="display: inline-block; font-size: clamp(0.75rem, 3vw, 0.9rem); color: var(--neon-cyan); margin-top: 12px; font-family: monospace; font-weight: bold; background: rgba(0, 245, 255, 0.1); padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(0, 245, 255, 0.3);">
                ${t('bdNextDrawPrefix')} --:--:--
              </div>
            </div>

            <!-- Distribution Cards Grid (50% / 30% / 10% / 10% Siguientes) -->
            <div class="prize-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-sm); width: 100%;">
              
              <div class="prize-card" style="border: 1px solid rgba(255, 215, 0, 0.3); background: rgba(255, 215, 0, 0.02); padding: 10px 6px; border-radius: var(--radius-md); text-align: center;">
                <span style="font-size: 0.68rem; color: var(--text-secondary); font-weight: bold;">🥇 1° Puesto (50%)</span>
                <div id="prize-amount-1st" style="font-family: var(--font-display); font-size: clamp(0.9rem, 3.2vw, 1.1rem); font-weight: 700; color: var(--neon-yellow); margin-top: 2px;">
                  0.00 USDC
                </div>
              </div>

              <div class="prize-card" style="border: 1px solid rgba(0, 245, 255, 0.3); background: rgba(0, 245, 255, 0.02); padding: 10px 6px; border-radius: var(--radius-md); text-align: center;">
                <span style="font-size: 0.68rem; color: var(--text-secondary); font-weight: bold;">🥈 2° Puesto (30%)</span>
                <div id="prize-amount-2nd" style="font-family: var(--font-display); font-size: clamp(0.9rem, 3.2vw, 1.1rem); font-weight: 700; color: var(--neon-cyan); margin-top: 2px;">
                  0.00 USDC
                </div>
              </div>

              <div class="prize-card" style="border: 1px solid rgba(255, 0, 229, 0.3); background: rgba(255, 0, 229, 0.02); padding: 10px 6px; border-radius: var(--radius-md); text-align: center;">
                <span style="font-size: 0.68rem; color: var(--text-secondary); font-weight: bold;">🥉 3° Puesto (10%)</span>
                <div id="prize-amount-3rd" style="font-family: var(--font-display); font-size: clamp(0.9rem, 3.2vw, 1.1rem); font-weight: 700; color: var(--neon-magenta); margin-top: 2px;">
                  0.00 USDC
                </div>
              </div>

              <div class="prize-card" style="border: 1px solid rgba(57, 255, 20, 0.3); background: rgba(57, 255, 20, 0.02); padding: 10px 6px; border-radius: var(--radius-md); text-align: center;">
                <span id="prize-label-others" style="font-size: 0.68rem; color: var(--text-secondary); font-weight: bold;">🏅 4° al 13° (10% / 10)</span>
                <div id="prize-amount-others" style="font-family: var(--font-display); font-size: clamp(0.9rem, 3.2vw, 1.1rem); font-weight: 700; color: var(--neon-green); margin-top: 2px;">
                  0.00 USDC c/u
                </div>
              </div>

            </div>
          </div>

          <!-- PLAY CTA -->
          <div style="width: 100%; display: flex; justify-content: center; margin-top: var(--space-xs);">
            <button class="btn btn-primary btn-lg" id="btn-goto-play" style="width: 100%; max-width: 320px; font-family: var(--font-display); font-size: clamp(0.95rem, 3.8vw, 1.15rem); letter-spacing: 1px; box-shadow: var(--shadow-neon-cyan); text-transform: uppercase;">
              🎮 ${t('bdPlayBtn')}
            </button>
          </div>

        </div>

      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'home');
  loadDashboardData(container);
}

function showSlotsExpansionPopup(unlockedSlots, isImminent, progressPct) {
  const storageKey = `frex_slots_popup_${unlockedSlots}_${isImminent ? 'imminent' : 'unlocked'}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, '1');

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.82); z-index: 999999;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  `;
  modal.innerHTML = `
    <div class="card card-glass" style="max-width: 420px; width: 100%; border: 2px solid var(--neon-green); box-shadow: 0 0 30px rgba(57,255,20,0.35); padding: 24px 20px; text-align: center; border-radius: 16px;">
      <div style="font-size: 2.6rem; margin-bottom: 8px;">🚀</div>
      <h3 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--neon-green); margin-bottom: 10px;">
        ${isImminent ? '¡Pronto se abrirán +10 Puestos de Premio!' : `¡${unlockedSlots} Puestos de Recompensa Habilitados!`}
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 18px;">
        ${isImminent
          ? `El premio menor está al <strong>${progressPct.toFixed(1)}%</strong> de superar los 10 USDC. ¡Prepárate porque pronto se habilitarán <strong>+10 nuevos puestos vacantes</strong> en la tabla de competencia!`
          : `El pozo superó el nivel y ahora hay <strong>${unlockedSlots} puestos de premio activos</strong> con lugares vacantes listos para llenarse. ¡Graba tu puntaje y asegura tu recompensa!`}
      </p>
      <button type="button" id="btn-close-slots-popup" class="btn btn-primary" style="width: 100%; font-family: var(--font-display);">
        ¡Entendido, a competir!
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btn-close-slots-popup')?.addEventListener('click', () => {
    modal.remove();
  });
}

async function loadDashboardData(container) {
  try {
    const currentUser = getUser();
    if (currentUser) {
      const pendingObj = getPendingScore();
      const pendingBd = pendingObj && pendingObj.blockdrop;
      const bestLocal = Math.max(Number(currentUser.high_score) || 0, Number(pendingBd?.score) || 0);
      if (bestLocal > 0) {
        await api.post('/scores/global', {
          score: bestLocal,
          level: pendingBd?.level || 1,
          linesCleared: pendingBd?.linesCleared || 0,
          duracionPartidaSegundos: Math.max(10, pendingBd?.duracionPartidaSegundos || 20),
          gameId: 'blockdrop'
        }).catch(() => {});
      }
    }

    const [leaderboard, globalLeaderboard, onChainStats, globalStats] = await Promise.all([
      fetchLeaderboard(100, 'blockdrop'),
      fetchGlobalLeaderboard(100, 'blockdrop'),
      getAaveFinancialData().catch(() => ({ interest: 0, totalDeposited: 0, currentBalance: 0 })),
      api.get('/stats/global?t=' + Date.now()).catch(() => ({ totalDeposited: undefined }))
    ]);

    const meta = getLeaderboardMeta();
    let unlockedSlots = meta.unlockedSlots || 3;
    let secondarySlots = meta.secondarySlots !== undefined ? meta.secondarySlots : Math.max(0, unlockedSlots - 3);
    const gameSharePct = (meta.gamesDistribution?.blockdrop?.percentage ?? 100) / 100;

    let totalSimulatedDeposit = (globalStats && typeof globalStats.totalDeposited === 'number')
      ? globalStats.totalDeposited
      : (onChainStats.totalDeposited || 0);
      
    const currentBalance = onChainStats.currentBalance || 0;
    const trueInterest = Math.max(0, currentBalance - totalSimulatedDeposit);

    // 70% of total weekly interest goes to games, multiplied by BlockDrop's share of score recordings
    let poolBalance = trueInterest * 0.70 * gameSharePct;

    const emptyAvatar = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

    // Render Competition Table rows (When secondarySlots === 0, only Top 3 are rewarded; when >= 10, renders 4 to unlockedSlots)
    const renderCompetitionRows = (currentSecondaryEach) => {
      const tableContainer = document.getElementById('leaderboard-table-container');
      const headerEl = document.getElementById('secondary-positions-header');
      if (!tableContainer) return;
      tableContainer.innerHTML = '';

      if (secondarySlots <= 0 || unlockedSlots <= 3) {
        if (headerEl) {
          headerEl.textContent = `🔒 Puestos 4° al 13° (Se habilitan cuando el 3° Puesto supere 10 USDC)`;
        }
        tableContainer.innerHTML = `
          <div style="text-align: center; padding: 14px 12px; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; color: var(--text-muted); font-size: 0.78rem; line-height: 1.5;">
            🏆 <strong>Actualmente el reparto es exclusivo entre los 3 primeros puestos.</strong><br>
            Apenas el premio del <strong>3° Puesto supere los 10.00 USDC</strong>, se abrirán aquí automáticamente los <strong>primeros 10 puestos siguientes (4° al 13°)</strong> con lugares vacíos para que más jugadores ganen.
          </div>
        `;
        return;
      }

      if (headerEl) {
        headerEl.textContent = `🏅 Puestos de Premio 4° al ${unlockedSlots}° (10% Repartido entre ${secondarySlots} puestos)`;
      }

      for (let rank = 4; rank <= unlockedSlots; rank++) {
        const player = leaderboard[rank - 1];
        const row = document.createElement('div');
        row.className = 'leaderboard-row';

        if (player) {
          const username = player.username || 'Anon';
          const score = player.score ? player.score.toLocaleString() : '0';
          const avatar = player.avatarUrl || emptyAvatar(username);
          const isCurrentUser = currentUser && currentUser.username === player.username;
          const playerLevel = getUserLevel(player.total_depositado || 0);
          const isMadera = playerLevel.id === 'madera';
          const maderaPct = isMadera ? Math.min(100, Math.floor((player.total_depositado || 0) * 10)) : 100;

          row.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 12px; background: rgba(255, 255, 255, 0.03);
            border: 1px solid ${isCurrentUser ? 'rgba(0, 245, 255, 0.35)' : 'rgba(255, 255, 255, 0.06)'};
            border-radius: var(--radius-sm); gap: 8px;
          `;
          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
              <span style="font-family: var(--font-display); font-size: 0.82rem; color: var(--neon-green); min-width: 24px;">#${rank}</span>
              ${wrapWithBadge(`<img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-card); object-fit: cover;">`, player.platform || 'html5')}
              <span style="font-size: 0.85rem; font-weight: 600; color: ${isCurrentUser ? 'var(--neon-cyan)' : 'var(--text-primary)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${username}</span>
              ${renderLevelBadge(playerLevel, 'sm')}
              ${isMadera ? `<span style="font-size: 0.65rem; color: #d97706; border: 1px solid rgba(217,119,6,0.4); padding: 1px 5px; border-radius: 6px;" title="Rango Madera cobra proporcional al depósito (${maderaPct}%)">${maderaPct}% premio</span>` : ''}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;">
              <span style="font-family: var(--font-display); font-size: 0.82rem; color: var(--neon-cyan);">${score} pts</span>
              <span class="slot-live-prize" style="font-size: 0.68rem; color: var(--neon-green); font-family: monospace;">+${currentSecondaryEach.toFixed(4)} USDC</span>
            </div>
          `;
        } else {
          // VACANT REWARD SLOT
          row.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 12px; background: rgba(57, 255, 20, 0.03);
            border: 1px dashed rgba(57, 255, 20, 0.25);
            border-radius: var(--radius-sm); gap: 8px;
          `;
          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: var(--font-display); font-size: 0.82rem; color: var(--text-muted); min-width: 24px;">#${rank}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">🔓 Puesto Vacante — ¡Inscribe tu puntaje!</span>
            </div>
            <span class="slot-live-prize" style="font-size: 0.72rem; color: var(--neon-green); font-family: monospace; font-weight: bold;">+${currentSecondaryEach.toFixed(4)} USDC</span>
          `;
        }
        tableContainer.appendChild(row);
      }
    };

    const updateRewardsUI = (balance) => {
      const reward3rdBase = balance * 0.10;
      const secondaryTotal = balance * 0.10;

      // Escalado progresivo:
      // 1) Al principio solo los 3 primeros (secondarySlots = 0).
      // 2) Cuando el premio del 3er puesto (reward3rdBase) > 10 USDC, habilita los primeros 10 siguientes (secondarySlots = 10).
      // 3) Cuando el premio de esos 10 siguientes supere 10 USDC c/u, habilita los siguientes 10 (20, 30...) y así sucesivamente.
      let calcSecondarySlots = secondarySlots;
      if (reward3rdBase > 10) {
        calcSecondarySlots = Math.max(10, calcSecondarySlots);
        while ((secondaryTotal / calcSecondarySlots) > 10) {
          calcSecondarySlots += 10;
        }
      }

      if (calcSecondarySlots > secondarySlots) {
        secondarySlots = calcSecondarySlots;
        unlockedSlots = 3 + secondarySlots;
        // Persistir desbloqueo en el servidor
        fetchLeaderboard(100, 'blockdrop', balance).catch(() => {});
        renderCompetitionRows(secondaryTotal / secondarySlots);
        showSlotsExpansionPopup(unlockedSlots, false, 100);
      }

      const isTop3Only = secondarySlots === 0;
      const reward1st = isTop3Only ? (balance * (0.50 / 0.90)) : (balance * 0.50);
      const reward2nd = isTop3Only ? (balance * (0.30 / 0.90)) : (balance * 0.30);
      const reward3rd = isTop3Only ? (balance * (0.10 / 0.90)) : (balance * 0.10);
      const rewardOthersEach = secondarySlots > 0 ? (secondaryTotal / secondarySlots) : 0;
      
      const elTotal = document.getElementById('prize-pool-total');
      const el1st = document.getElementById('prize-amount-1st');
      const el2nd = document.getElementById('prize-amount-2nd');
      const el3rd = document.getElementById('prize-amount-3rd');
      const elOthers = document.getElementById('prize-amount-others');
      const elOthersLabel = document.getElementById('prize-label-others');
      
      if (elTotal) elTotal.textContent = `${balance.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el1st) el1st.textContent = `${reward1st.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el2nd) el2nd.textContent = `${reward2nd.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el3rd) el3rd.textContent = `${reward3rd.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;

      if (isTop3Only) {
        if (elOthersLabel) elOthersLabel.textContent = `🔒 4° al 13° (Cuando 3° > 10 USDC)`;
        if (elOthers) elOthers.textContent = `3° al ${Math.min(100, (reward3rdBase / 10) * 100).toFixed(1)}%`;
      } else {
        if (elOthersLabel) elOthersLabel.textContent = `🏅 4° al ${unlockedSlots}° (10% / ${secondarySlots})`;
        if (elOthers) elOthers.textContent = `${rewardOthersEach.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC c/u`;
      }

      // Update live prize labels inside the competition table
      document.querySelectorAll('.slot-live-prize').forEach(el => {
        el.textContent = `+${rewardOthersEach.toFixed(4)} USDC`;
      });

      // Update +10 Slots Expansion Progress Bar & Countdown
      const barEl = document.getElementById('slots-expansion-bar');
      const titleEl = document.getElementById('slots-expansion-title');
      const badgeEl = document.getElementById('slots-expansion-badge');
      const descEl = document.getElementById('slots-expansion-desc');

      if (isTop3Only) {
        const progressPct = Math.min(100, (reward3rdBase / 10) * 100);
        if (barEl) barEl.style.width = `${progressPct.toFixed(2)}%`;
        if (titleEl) titleEl.textContent = `🔓 Puestos de Recompensa Activos: Solo los 3 Primeros (1°, 2° y 3°)`;
        if (badgeEl) badgeEl.textContent = `Meta Primeros 10 Siguientes: ${progressPct.toFixed(1)}% (${reward3rdBase.toFixed(2)} / 10 USDC en 3° Puesto)`;
        if (descEl) {
          const missing3rd = Math.max(0, 10 - reward3rdBase);
          descEl.innerHTML = `Al principio solo se reparte entre los 3 primeros. Faltan <strong>${missing3rd.toFixed(2)} USDC</strong> en el 3° Puesto para habilitar el reparto a los <strong>primeros 10 siguientes (Puestos 4° al 13°)</strong> con lugares vacíos.`;
        }
        if (progressPct >= 80 && progressPct < 100) {
          showSlotsExpansionPopup(13, true, progressPct);
        }
      } else {
        const progressPct = Math.min(100, (rewardOthersEach / 10) * 100);
        if (barEl) barEl.style.width = `${progressPct.toFixed(2)}%`;
        if (titleEl) titleEl.textContent = `🔓 Puestos de Recompensa Activos: 1° al ${unlockedSlots}° (Top 3 + ${secondarySlots} siguientes)`;
        if (badgeEl) badgeEl.textContent = `Meta +10 Puestos: ${progressPct.toFixed(1)}% (${rewardOthersEach.toFixed(2)} / 10 USDC)`;
        if (descEl) {
          const missingPerSlot = Math.max(0, 10 - rewardOthersEach);
          descEl.innerHTML = `Cuando el premio de los puestos 4° al ${unlockedSlots}° supere 10 USDC (faltan <strong>${missingPerSlot.toFixed(2)} USDC/puesto</strong>), se habilitarán automáticamente <strong>+10 puestos vacantes más (del ${unlockedSlots + 1}° al ${unlockedSlots + 10}°)</strong>.`;
        }
        if (progressPct >= 80 && progressPct < 100) {
          showSlotsExpansionPopup(unlockedSlots + 10, true, progressPct);
        }
      }
    };
    
    renderCompetitionRows(secondarySlots > 0 ? ((poolBalance * 0.10) / secondarySlots) : 0);
    updateRewardsUI(poolBalance);
    
    const interestPerSecond = (totalSimulatedDeposit * 0.04) / (365 * 24 * 60 * 60);
    const prizePoolIncrementPerSecond = interestPerSecond * 0.70 * gameSharePct;
    
    poolInterval = setInterval(() => {
      poolBalance += (prizePoolIncrementPerSecond / 10);
      updateRewardsUI(poolBalance);
    }, 100);

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const updateCountdown = () => {
      const now = Date.now();
      const timeSinceLastReset = now % WEEK_MS;
      const timeLeft = WEEK_MS - timeSinceLastReset;
      
      const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
      const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
      
      const el = document.getElementById('weekly-countdown');
      if (el) {
        el.textContent = `${t('bdNextDrawPrefix')} ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
      }
    };
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Populate Top 3 Podium
    const p1 = leaderboard[0] || { username: t('bdVacant'), score: 0 };
    const p2 = leaderboard[1] || { username: t('bdVacant'), score: 0 };
    const p3 = leaderboard[2] || { username: t('bdVacant'), score: 0 };

    const resolvePlayerDeposit = (p) => {
      const fromEntry = Number(p.total_depositado) || 0;
      if (currentUser && p.username && currentUser.username === p.username) {
        return Math.max(fromEntry, Number(currentUser.total_depositado) || 0);
      }
      return fromEntry;
    };

    document.getElementById('podium-user-1st').textContent = p1.username;
    document.getElementById('podium-score-1st').textContent = p1.score > 0 ? `${p1.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-1st').src = p1.avatarUrl || emptyAvatar(p1.username || '1st');
    document.getElementById('podium-badge-1st').innerHTML = getAvatarBadge(p1.platform || 'html5');
    if (p1.score > 0) {
      document.getElementById('podium-level-1st').innerHTML = renderLevelBadge(getUserLevel(resolvePlayerDeposit(p1)), 'sm');
    }

    document.getElementById('podium-user-2nd').textContent = p2.username;
    document.getElementById('podium-score-2nd').textContent = p2.score > 0 ? `${p2.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-2nd').src = p2.avatarUrl || emptyAvatar(p2.username || '2nd');
    document.getElementById('podium-badge-2nd').innerHTML = getAvatarBadge(p2.platform || 'html5');
    if (p2.score > 0) {
      document.getElementById('podium-level-2nd').innerHTML = renderLevelBadge(getUserLevel(resolvePlayerDeposit(p2)), 'sm');
    }

    document.getElementById('podium-user-3rd').textContent = p3.username;
    document.getElementById('podium-score-3rd').textContent = p3.score > 0 ? `${p3.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-3rd').src = p3.avatarUrl || emptyAvatar(p3.username || '3rd');
    document.getElementById('podium-badge-3rd').innerHTML = getAvatarBadge(p3.platform || 'html5');
    if (p3.score > 0) {
      document.getElementById('podium-level-3rd').innerHTML = renderLevelBadge(getUserLevel(resolvePlayerDeposit(p3)), 'sm');
    }

    // Populate Global Informative Leaderboard (Usuario - Puntaje - Rango)
    const globalContainer = document.getElementById('global-leaderboard-container');
    if (globalContainer) {
      globalContainer.innerHTML = '';
      if (!globalLeaderboard || globalLeaderboard.length === 0) {
        globalContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">
            Aún no hay puntajes registrados en la tabla global. ¡Juega una partida para aparecer aquí!
          </div>
        `;
      } else {
        globalLeaderboard.forEach((entry, idx) => {
          const rank = entry.rank || (idx + 1);
          const username = entry.username || 'Jugador';
          const score = (entry.score || 0).toLocaleString();
          const avatar = entry.avatarUrl || emptyAvatar(username);
          const isMe = currentUser && currentUser.username === entry.username;
          const levelInfo = getUserLevel(entry.total_depositado || 0);

          const row = document.createElement('div');
          row.style.cssText = `
            display: grid; grid-template-columns: 42px 1fr 120px 100px; align-items: center;
            padding: 8px 12px; background: ${isMe ? 'rgba(0, 245, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'};
            border: 1px solid ${isMe ? 'rgba(0, 245, 255, 0.35)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 8px; box-sizing: border-box; gap: 6px;
          `;
          row.innerHTML = `
            <span style="font-family: var(--font-display); font-size: 0.8rem; color: ${rank <= 3 ? 'var(--neon-yellow)' : 'var(--text-muted)'}; font-weight: bold;">
              ${rank === 1 ? '👑 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
            </span>
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
              ${wrapWithBadge(`<img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`, entry.platform || 'html5')}
              <span style="font-size: 0.85rem; font-weight: 600; color: ${isMe ? 'var(--neon-cyan)' : '#fff'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${username}
              </span>
            </div>
            <div style="display: flex; justify-content: center;">
              ${renderLevelBadge(levelInfo, 'sm')}
            </div>
            <span style="font-family: var(--font-display); font-size: 0.85rem; color: var(--neon-cyan); text-align: right;">
              ${score}
            </span>
          `;
          globalContainer.appendChild(row);
        });
      }
    }

    // Bind Tab Switcher
    const tabCompBtn = document.getElementById('tab-btn-competition');
    const tabGlobalBtn = document.getElementById('tab-btn-global');
    const secComp = document.getElementById('section-competition-board');
    const secGlobal = document.getElementById('section-global-board');

    tabCompBtn?.addEventListener('click', () => {
      tabCompBtn.className = 'btn btn-primary';
      tabGlobalBtn.className = 'btn btn-secondary';
      secComp?.classList.remove('hidden');
      secGlobal?.classList.add('hidden');
    });

    tabGlobalBtn?.addEventListener('click', () => {
      tabGlobalBtn.className = 'btn btn-primary';
      tabCompBtn.className = 'btn btn-secondary';
      secGlobal?.classList.remove('hidden');
      secComp?.classList.add('hidden');
    });

    // Swap loading spinner to main dashboard content
    document.getElementById('dashboard-loader')?.classList.add('hidden');
    document.getElementById('dashboard-main-content')?.classList.remove('hidden');

    // Bind Play CTA listener
    document.getElementById('btn-goto-play')?.addEventListener('click', () => {
      window.location.hash = '#/play';
    });

    renderFooter(container.querySelector('.home-page'));

  } catch (err) {
    console.error("Failed to load dashboard yield details:", err);
    showToast(t('bdErrorLoading'), "error");
  }
}

export function cleanupHomePage() {
  // No-op cleanup
}
