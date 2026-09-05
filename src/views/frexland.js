import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { t } from '../utils/i18n.js';
import { getUser } from '../services/auth.js';

export function renderFrexlandPage(container) {
  const user = getUser();
  const ADMIN_WALLETS = [
    '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
    '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
  ];
  const TECNICO_EMAILS = ['tecnico@frexland.com', 'tester@frexland.com'];
  const userWallets = (user?.walletAddresses || []).concat(
    user?.wallets ? Object.values(user.wallets) : []
  ).map(w => (w || '').toLowerCase());
  const isAdmin = user && (user.isAdmin === true || user.role === 'admin' || userWallets.some(w => ADMIN_WALLETS.includes(w)));
  const isTecnico = user && (user.role === 'tecnico' || user.role === 'tester' || TECNICO_EMAILS.includes((user.email || '').toLowerCase()));
  const canAccessGame = isAdmin || isTecnico;
  const IS_MAINTENANCE_MODE = true;
  const showMaintenanceBanner = IS_MAINTENANCE_MODE && !canAccessGame;

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page frexland-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-bottom: var(--space-2xl); background: radial-gradient(circle at top, #2a0845 0%, #000000 100%); min-height: 100vh;">
      <div class="frexland-content" style="max-width: 1000px; width: 100%; display: flex; flex-direction: column; gap: var(--space-xl); align-items: center; padding: var(--space-md); box-sizing: border-box;">
        
        <!-- Header Retro (Estilo Distinto a Blockdrop) -->
        <div class="frexland-header" style="text-align: center; width: 100%;">
          <h1 class="frexland-title retro-text" style="font-size: clamp(1.4rem, 6.5vw, 2.6rem); color: #ff8c00; text-shadow: 3px 3px 0 #9400d3, 6px 6px 0 #39ff14; margin-bottom: 8px; font-family: 'Press Start 2P', cursive; line-height: 1.3;">FrexLand</h1>
          <p class="frexland-subtitle retro-text" style="font-size: clamp(0.6rem, 2.6vw, 0.85rem); color: #39ff14; margin-top: 8px; font-family: 'Press Start 2P', cursive; text-shadow: 1px 1px 2px #000;">El Arcade del Futuro</p>
        </div>

        <!-- Grid de Juegos (Ahora Primero) -->
        <div style="width: 100%;">
          ${showMaintenanceBanner ? `
            <div style="background: rgba(255, 140, 0, 0.15); border: 2px dashed #ff8c00; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; text-align: center; color: #ffeb3b; font-family: 'Press Start 2P', cursive; font-size: clamp(0.6rem, 2.5vw, 0.75rem); line-height: 1.6; box-shadow: 0 0 15px rgba(255, 140, 0, 0.3);">
              🛠️ MODO MANTENIMIENTO ACTIVO: Los servidores de juego se encuentran en calibración técnica. Tu saldo y créditos están seguros.
            </div>
          ` : ''}
          <h3 class="retro-text" style="font-size: clamp(0.75rem, 3.2vw, 1.1rem); text-align: center; margin-bottom: var(--space-md); color: #fff; font-family: 'Press Start 2P', cursive; text-shadow: 2px 2px #9400d3;">${t('gameSelect')}</h3>
          <div class="games-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; width: 100%; box-sizing: border-box;">
            
            <!-- BlockDrop -->
            <div class="game-card active-game" onclick="localStorage.setItem('last_played_game', '#/play'); window.location.hash='#/blockdrop'" style="cursor: pointer; position: relative; overflow: hidden; border: 3px solid #ff8c00; transition: transform 0.3s; background: rgba(0,0,0,0.8); box-shadow: 0 0 15px rgba(255,140,0,0.5); border-radius: 8px;">
              <div style="height: 130px; background: linear-gradient(135deg, rgba(233,30,99,0.3) 0%, rgba(10,10,26,1) 100%); display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 3px solid #ff8c00;">
                <div style="display: grid; grid-template-columns: repeat(3, 18px); gap: 2px;">
                  <div style="width: 18px; height: 18px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff;"></div>
                  <div style="width: 18px; height: 18px; background: #e91e63; box-shadow: 0 0 10px #e91e63;"></div>
                  <div style="width: 18px; height: 18px; background: #ffeb3b; box-shadow: 0 0 10px #ffeb3b;"></div>
                  <div style="width: 18px; height: 18px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff;"></div>
                </div>
              </div>
              <div style="padding: 14px 10px; text-align: center;">
                <h4 style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.85rem, 3.5vw, 1.05rem); color: #ff8c00; margin-bottom: 10px;">BlockDrop</h4>
                <p style="font-size: 0.8rem; color: #ccc; margin-bottom: 14px; font-family: monospace; line-height: 1.4;">${t('gameTetrisDesc')}</p>
                <button class="btn" style="background: #9400d3; color: #39ff14; width: 100%; font-weight: bold; border-radius: 0; font-family: 'Press Start 2P', cursive; font-size: 0.65rem; padding: 12px; border: 2px solid #39ff14;">${t('playBtn')}</button>
              </div>
            </div>

            <!-- Snake (Próximamente) -->
            <div class="game-card disabled-game" style="position: relative; overflow: hidden; border: 3px solid #555; background: rgba(0,0,0,0.8); opacity: 0.7; border-radius: 8px;">
              <div style="height: 130px; background: #222; display: flex; align-items: center; justify-content: center; border-bottom: 3px solid #555;">
                <div style="font-size: 2.5rem; filter: grayscale(1);">🐍</div>
              </div>
              <div style="padding: 14px 10px; text-align: center;">
                <h4 style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.75rem, 3vw, 0.95rem); color: #888; margin-bottom: 10px;">Crypto Snake</h4>
                <p style="font-size: 0.8rem; color: #777; margin-bottom: 14px; font-family: monospace; line-height: 1.4;">${t('gameComingSoonDesc')}</p>
                <button class="btn" style="background: #333; color: #888; width: 100%; cursor: not-allowed; border-radius: 0; font-family: 'Press Start 2P', cursive; font-size: 0.55rem; padding: 12px; border: 2px solid #555;">${t('gameComingSoon')}</button>
              </div>
            </div>

          </div>
        </div>

        <!-- Tabla de Popularidad (Fondo Común Global) -->
        <div class="card card-glass global-pool-section" style="width: 100%; border: 3px solid #9400d3; box-shadow: 0 0 20px rgba(148,0,211,0.4); position: relative; overflow: hidden; background: rgba(0,0,0,0.85); margin-top: 6px; padding: 16px 12px; box-sizing: border-box;">
          <div style="text-align: center; margin-bottom: var(--space-md);">
            <h2 class="retro-text" style="font-size: clamp(0.75rem, 3.2vw, 1.05rem); color: #ff8c00; margin-bottom: 10px; font-family: 'Press Start 2P', cursive; line-height: 1.4;">${t('prizeDistTitle')}</h2>
            <p style="color: #aaa; font-size: 0.8rem; line-height: 1.4;">${t('prizeDistDesc')}</p>
          </div>

          <!-- Distribución Mockup -->
          <div style="width: 100%; padding: 0 4px; box-sizing: border-box;">
            <div style="font-size: 0.85rem; color: #fff; margin-bottom: 6px; display: flex; justify-content: space-between; font-family: 'Press Start 2P', cursive; font-size: 0.62rem;">
              <span>BlockDrop</span>
              <span style="color: #39ff14;">100%</span>
            </div>
            <div style="width: 100%; height: 14px; background: #000; border: 2px solid #fff; margin-bottom: 16px;">
              <div style="width: 100%; height: 100%; background: #39ff14; box-shadow: 0 0 10px #39ff14;"></div>
            </div>

            <div style="font-size: 0.85rem; color: #fff; margin-bottom: 6px; display: flex; justify-content: space-between; font-family: 'Press Start 2P', cursive; font-size: 0.62rem;">
              <span>Crypto Snake</span>
              <span style="color: #555;">0%</span>
            </div>
            <div style="width: 100%; height: 14px; background: #000; border: 2px solid #555;">
              <div style="width: 0%; height: 100%; background: #555;"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
    <div id="footer-container"></div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'home');
  renderFooter(document.getElementById('footer-container'));
}

export function cleanupFrexlandPage() {
  // Add any cleanup if necessary
}
