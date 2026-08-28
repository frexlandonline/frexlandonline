import { renderNavbar } from '../components/navbar.js';
import { t } from '../utils/i18n.js';
import { getUser } from '../services/auth.js';
import { getAvatarBadge, wrapWithBadge } from '../components/avatarBadge.js';
import api from '../services/api.js';
import { fetchLeaderboard } from '../components/leaderboard.js';
import { showToast } from '../main.js';
import { renderFooter } from '../components/footer.js';
import { getAaveFinancialData } from '../web3/contract.ts';

let poolInterval;
let leaderboardInterval;

export function cleanupBlockdropPage() {
  if (leaderboardInterval) clearInterval(leaderboardInterval);
  if (poolInterval) clearInterval(poolInterval);
}

export async function renderBlockdropPage(container) {
  // 1. Initial skeleton with loader
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-bottom: var(--space-2xl);">
      <div class="home-content" style="max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: var(--space-xl); align-items: center; padding: var(--space-lg);">
        
        <div style="text-align: center; margin-top: var(--space-md);">
          <h1 class="text-gradient text-glow" style="font-family: var(--font-display); font-size: 2.8rem; letter-spacing: 2px; margin-bottom: 8px; animation: float 3s ease-in-out infinite;">
            ⬢ BLOCKDROP
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 500px; margin: 0 auto; line-height: 1.5;">
            ${t('bdSubtitle')}
          </p>
        </div>

        <!-- Dashboard Loader -->
        <div id="dashboard-loader" style="display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: 50px;">
          <div class="spinner"></div>
          <span style="color: var(--text-secondary); font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 1px;">${t('bdLoadingBoard')}</span>
        </div>

        <!-- Dashboard Content (hidden initially) -->
        <div id="dashboard-main-content" class="hidden" style="width: 100%; display: flex; flex-direction: column; gap: var(--space-xl); align-items: center;">
          
          <!-- PODIUM SECTION -->
          <div class="card card-glass" style="width: 100%; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); display: flex; flex-direction: column; align-items: center; gap: var(--space-lg); padding: var(--space-xl) var(--space-lg);">
            <div style="text-align: center;">
              <h2 style="font-family: var(--font-display); font-size: 1.4rem; color: #fff; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                🏆 ${t('bdPodiumTitle')}
              </h2>
              <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">
                ${t('bdPodiumDesc')}
              </p>
            </div>

            <!-- Visual Podium Columns -->
            <div class="podium-container">
              
              <!-- 2ND PLACE -->
              <div class="podium-col podium-step-2" id="podium-2nd">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">🥈</div>
                  <img id="podium-img-2nd" src="" class="podium-avatar">
                  <div id="podium-badge-2nd" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-2nd">-</div>
                <div class="podium-score" id="podium-score-2nd">- pts</div>
                <div class="podium-step-body" style="height: 120px;">
                  <span class="podium-step-num">2</span>
                </div>
              </div>

              <!-- 1ST PLACE -->
              <div class="podium-col podium-step-1" id="podium-1st">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">👑</div>
                  <img id="podium-img-1st" src="" class="podium-avatar">
                  <div id="podium-badge-1st" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-1st">-</div>
                <div class="podium-score" id="podium-score-1st">- pts</div>
                <div class="podium-step-body" style="height: 160px; border-color: rgba(255, 215, 0, 0.45); box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);">
                  <span class="podium-step-num">1</span>
                </div>
              </div>

              <!-- 3RD PLACE -->
              <div class="podium-col podium-step-3" id="podium-3rd">
                <div class="podium-avatar-wrapper avatar-container">
                  <div class="podium-medal">🥉</div>
                  <img id="podium-img-3rd" src="" class="podium-avatar">
                  <div id="podium-badge-3rd" style="position: absolute; bottom: 0; right: 0;"></div>
                </div>
                <div class="podium-username" id="podium-user-3rd">-</div>
                <div class="podium-score" id="podium-score-3rd">- pts</div>
                <div class="podium-step-body" style="height: 90px;">
                  <span class="podium-step-num">3</span>
                </div>
              </div>

            </div>

            <!-- Leaderboard Table (Ranks 4-10) -->
            <div style="width: 100%; max-width: 500px; margin-top: var(--space-md); border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: var(--space-md);">
              <h3 style="font-family: var(--font-display); font-size: 0.9rem; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: var(--space-sm); text-align: center;">
                ${t('bdPositions4to10')}
              </h3>
              <div id="leaderboard-table-container" style="display: flex; flex-direction: column; gap: 6px;">
                <!-- Dynamically populated rows -->
              </div>
            </div>

          </div>

          <!-- REWARD POOL SECTION -->
          <div class="card" style="width: 100%; border: 1.5px solid var(--border-glow); display: flex; flex-direction: column; align-items: center; gap: var(--space-lg); padding: var(--space-xl);">
            <div style="text-align: center; width: 100%;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;">
                💰 ${t('bdRewardPool')}
              </span>
              <div id="prize-pool-total" style="font-family: var(--font-display); font-size: 2.8rem; font-weight: 900; color: var(--neon-green); text-shadow: 0 0 15px rgba(0, 255, 136, 0.4); margin: 8px 0;">
                0.00 USDC
              </div>
              <p style="color: var(--text-muted); font-size: 0.8rem; max-width: 480px; margin: 0 auto; line-height: 1.4;">
                ${t('bdRewardPoolDesc')}
              </p>
              <div id="weekly-countdown" style="display: inline-block; font-size: 0.9rem; color: var(--neon-cyan); margin-top: 15px; font-family: monospace; font-weight: bold; background: rgba(0, 245, 255, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(0, 245, 255, 0.3);">
                ${t('bdNextDrawPrefix')} --:--:--
              </div>
            </div>

            <!-- Distribution Cards Grid -->
            <div class="prize-grid" style="display: grid; gap: var(--space-md); width: 100%;">
              
              <div class="prize-card" style="border: 1px solid rgba(255, 215, 0, 0.3); background: rgba(255, 215, 0, 0.02); padding: 12px; border-radius: var(--radius-md); text-align: center; transition: all 0.2s ease;">
                <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${t('bdPrize1st')}</span>
                <div id="prize-amount-1st" style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--neon-yellow); margin-top: 4px;">
                  0.00 USDC
                </div>
              </div>

              <div class="prize-card" style="border: 1px solid rgba(0, 245, 255, 0.3); background: rgba(0, 245, 255, 0.02); padding: 12px; border-radius: var(--radius-md); text-align: center; transition: all 0.2s ease;">
                <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${t('bdPrize2nd')}</span>
                <div id="prize-amount-2nd" style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--neon-cyan); margin-top: 4px;">
                  0.00 USDC
                </div>
              </div>

              <div class="prize-card" style="border: 1px solid rgba(255, 0, 229, 0.3); background: rgba(255, 0, 229, 0.02); padding: 12px; border-radius: var(--radius-md); text-align: center; transition: all 0.2s ease;">
                <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${t('bdPrize3rd')}</span>
                <div id="prize-amount-3rd" style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--neon-magenta); margin-top: 4px;">
                  0.00 USDC
                </div>
              </div>

            </div>
          </div>

          <!-- PLAY CTA -->
          <div style="width: 100%; display: flex; justify-content: center; margin-top: var(--space-md);">
            <button class="btn btn-primary btn-lg" id="btn-goto-play" style="width: 100%; max-width: 320px; font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 1px; box-shadow: var(--shadow-neon-cyan); text-transform: uppercase;">
              🎮 ${t('bdPlayBtn')}
            </button>
          </div>

        </div>

      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'home');

  // 2. Fetch and render data dynamically
  loadDashboardData(container);
}

async function loadDashboardData(container) {
  try {
    const [leaderboard, onChainStats, globalStats] = await Promise.all([
      fetchLeaderboard(),
      getAaveFinancialData().catch(() => ({ interest: 0, totalDeposited: 0, currentBalance: 0 })),
      api.get('/stats/global?t=' + Date.now()).catch(() => ({ totalDeposited: undefined }))
    ]);

    let totalSimulatedDeposit = onChainStats.totalDeposited || 0;
      
    const currentBalance = onChainStats.currentBalance || 0;
    const trueInterest = Math.max(0, currentBalance - totalSimulatedDeposit);

    let poolBalance = trueInterest * 0.70;
    
    const updateRewardsUI = (balance) => {
      const reward1st = balance * 0.50;
      const reward2nd = balance * 0.35;
      const reward3rd = balance * 0.15;
      
      const elTotal = document.getElementById('prize-pool-total');
      const el1st = document.getElementById('prize-amount-1st');
      const el2nd = document.getElementById('prize-amount-2nd');
      const el3rd = document.getElementById('prize-amount-3rd');
      
      if (elTotal) elTotal.textContent = `${balance.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el1st) el1st.textContent = `${reward1st.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el2nd) el2nd.textContent = `${reward2nd.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
      if (el3rd) el3rd.textContent = `${reward3rd.toLocaleString('es-ES', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USDC`;
    };
    
    updateRewardsUI(poolBalance);
    
    const interestPerSecond = (totalSimulatedDeposit * 0.04) / (365 * 24 * 60 * 60);
    const prizePoolIncrementPerSecond = interestPerSecond * 0.70;
    
    setInterval(() => {
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
    setInterval(updateCountdown, 1000);

    const emptyAvatar = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    const p1 = leaderboard[0] || { username: t('bdVacant'), score: 0 };
    const p2 = leaderboard[1] || { username: t('bdVacant'), score: 0 };
    const p3 = leaderboard[2] || { username: t('bdVacant'), score: 0 };

    document.getElementById('podium-user-1st').textContent = p1.username;
    document.getElementById('podium-score-1st').textContent = p1.score > 0 ? `${p1.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-1st').src = p1.avatarUrl || emptyAvatar(p1.username || '1st');
    document.getElementById('podium-badge-1st').innerHTML = getAvatarBadge(p1.platform || 'html5');

    document.getElementById('podium-user-2nd').textContent = p2.username;
    document.getElementById('podium-score-2nd').textContent = p2.score > 0 ? `${p2.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-2nd').src = p2.avatarUrl || emptyAvatar(p2.username || '2nd');
    document.getElementById('podium-badge-2nd').innerHTML = getAvatarBadge(p2.platform || 'html5');

    document.getElementById('podium-user-3rd').textContent = p3.username;
    document.getElementById('podium-score-3rd').textContent = p3.score > 0 ? `${p3.score.toLocaleString()} pts` : '-';
    document.getElementById('podium-img-3rd').src = p3.avatarUrl || emptyAvatar(p3.username || '3rd');
    document.getElementById('podium-badge-3rd').innerHTML = getAvatarBadge(p3.platform || 'html5');

    const currentUser = await getUser();
    const tableContainer = document.getElementById('leaderboard-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = '';
      const extraPlayers = leaderboard.slice(3, 10);
      if (extraPlayers.length === 0) {
        tableContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">
            ${t('bdNoPlayersYet')}
          </div>
        `;
      } else {
        extraPlayers.forEach(async (player, idx) => {
          const rank = idx + 4;
          const username = player.username || 'Anon';
          const score = player.score ? player.score.toLocaleString() : '0';
          const avatar = player.avatarUrl || emptyAvatar(username);
          const isCurrentUser = currentUser && currentUser.username === player.username;

          const row = document.createElement('div');
          row.className = 'leaderboard-row';
          row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
          `;
          
          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-family: var(--font-display); font-size: 0.85rem; color: var(--text-muted); width: 15px; text-align: right;">${rank}</span>
              ${wrapWithBadge(`<img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-card); object-fit: cover;">`, player.platform || 'html5')}
              <span style="font-size: 0.85rem; font-weight: 500; color: ${isCurrentUser ? 'var(--neon-cyan)' : 'var(--text-secondary)'};">${username}</span>
            </div>
            <span style="font-family: var(--font-display); font-size: 0.85rem; color: var(--neon-cyan);">${score} pts</span>
          `;
          
          row.addEventListener('mouseenter', () => {
            row.style.background = 'rgba(0, 245, 255, 0.05)';
            row.style.borderColor = 'rgba(0, 245, 255, 0.15)';
          });
          row.addEventListener('mouseleave', () => {
            row.style.background = 'rgba(255, 255, 255, 0.02)';
            row.style.borderColor = 'rgba(255, 255, 255, 0.04)';
          });
          
          tableContainer.appendChild(row);
        });
      }
    }

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

