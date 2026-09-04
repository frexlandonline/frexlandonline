import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { t } from '../utils/i18n.js';

export function renderMaintenancePage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="maintenance-page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 120px); padding: var(--space-xl) var(--space-md); text-align: center; box-sizing: border-box; background: radial-gradient(circle at center, rgba(147, 51, 234, 0.15) 0%, rgba(10, 10, 26, 0.95) 100%);">
      <div class="card card-glass" style="max-width: 520px; width: 100%; padding: 32px 24px; border: 2px solid var(--neon-cyan); border-radius: 16px; box-shadow: 0 0 25px rgba(0, 245, 255, 0.25); background: rgba(13, 13, 27, 0.95); display: flex; flex-direction: column; align-items: center; gap: 20px;">
        
        <div style="font-size: 3.5rem; filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.6));">
          🛠️
        </div>

        <h1 style="font-family: 'Press Start 2P', cursive; font-size: clamp(1rem, 4vw, 1.4rem); color: #ff8c00; text-shadow: 2px 2px 0 #9400d3, 4px 4px 0 #39ff14; line-height: 1.4; margin: 0;">
          MODO MANTENIMIENTO
        </h1>

        <div style="height: 2px; width: 80px; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink)); border-radius: 2px;"></div>

        <p style="font-family: var(--font-ui); font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
          Los servidores de juego se encuentran actualmente en mantenimiento técnico y pruebas de calibración.
        </p>

        <div style="background: rgba(0, 245, 255, 0.06); border: 1px dashed rgba(0, 245, 255, 0.3); padding: 12px 16px; border-radius: 8px; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; width: 100%; box-sizing: border-box;">
          🎮 Estamos realizando pruebas técnicas para garantizar la mejor experiencia. Tu saldo y créditos están seguros y el juego volverá a estar disponible en breve.
        </div>

        <div style="display: flex; gap: 12px; width: 100%; margin-top: 10px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="window.location.hash = '#/home'" style="flex: 1; min-width: 140px; padding: 12px; font-size: 0.85rem; text-transform: uppercase;">
            🏠 Ir al Inicio
          </button>
          <button class="btn btn-secondary" onclick="window.location.hash = '#/wallet'" style="flex: 1; min-width: 140px; padding: 12px; font-size: 0.85rem; text-transform: uppercase;">
            💎 Mi Billetera
          </button>
        </div>
      </div>
    </div>
    <div id="footer-container"></div>
  `;

  renderNavbar();
  renderFooter();
}
