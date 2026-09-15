import { t } from '../utils/i18n.js';
import { authenticateWorld } from '../web3/world.ts';
import { loginWithWorld } from '../services/auth.js';
import { showToast } from '../main.js';
import { checkAndShowWinnerModal } from '../components/winnerModal.js';

export function renderWorldAuthPage(container) {
  container.innerHTML = `
    <div class="auth-page frexland-page" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; background: radial-gradient(circle at top, #2a0845 0%, #0c0018 100%);">
      <div class="auth-container" style="max-width: 420px; width: 100%;">
        
        <!-- Retro Arcade Logo -->
        <div class="auth-logo" style="text-align: center; margin-bottom: 24px;">
          <span class="auth-logo-icon" style="font-size: 3.2rem; display: block; filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.6));">🕹️</span>
          <div class="auth-logo-text retro-text" style="font-family: 'Press Start 2P', cursive; font-size: clamp(1.3rem, 6vw, 1.9rem); color: #ff8c00; text-shadow: 3px 3px 0 #9400d3, 5px 5px 0 #39ff14; margin-top: 10px; line-height: 1.3;">
            FREXLAND
          </div>
          <p class="retro-text" style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.55rem, 2.5vw, 0.72rem); color: #39ff14; margin-top: 8px; text-shadow: 1px 1px 2px #000;">
            El Arcade del Futuro
          </p>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 140, 0, 0.15); border: 1.5px solid #ff8c00; padding: 5px 14px; border-radius: 8px; font-size: 0.62rem; color: #ffeb3b; margin-top: 12px; font-weight: 700; font-family: 'Press Start 2P', cursive; box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);">
            <span>🌍</span> World App Edition
          </div>
        </div>

        <!-- Retro Arcade Card -->
        <div class="card" style="border: 3px solid #ff8c00; background: rgba(26, 5, 46, 0.95); border-radius: 14px; padding: 26px 18px; box-shadow: 0 0 25px rgba(255, 140, 0, 0.4), 0 0 15px rgba(148, 0, 211, 0.3); text-align: center; box-sizing: border-box;">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">🪙</div>
          <h2 class="retro-text" style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.8rem, 3.6vw, 1.05rem); color: #ff8c00; text-shadow: 2px 2px 0 #9400d3; margin-bottom: 14px; line-height: 1.4;">
            INSERT COIN & START
          </h2>
          <p style="color: #ccc; font-size: 0.82rem; line-height: 1.5; margin-bottom: 22px; font-family: monospace;">
            Conecta tu billetera de <strong style="color: #39ff14;">World App</strong> para entrar al arcade y competir por el pozo semanal.
          </p>

          <button class="btn btn-primary btn-lg btn-full" id="btn-world-login-direct" style="min-height: 48px; font-size: clamp(0.68rem, 2.7vw, 0.82rem); font-family: 'Press Start 2P', cursive; background: #9400d3; color: #39ff14; border: 2px solid #39ff14; box-shadow: 0 0 15px rgba(57, 255, 20, 0.5), 0 0 8px rgba(148, 0, 211, 0.6); display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px; white-space: normal; padding: 14px 10px; border-radius: 8px; cursor: pointer;">
            <span>🌐</span> Conectar e Iniciar Sesión
          </button>

          <div style="font-size: 0.72rem; color: #888; line-height: 1.4; font-family: monospace;">
            Al conectar aceptas los Términos de Servicio y la Política de Privacidad de Frexland.
          </div>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('btn-world-login-direct');
  if (btn) {
    btn.addEventListener('click', async () => {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '⏳ Conectando billetera...';
      btn.disabled = true;

      try {
        const authResult = await authenticateWorld();
        const payload = authResult.payload || authResult;
        const walletAddress = payload.address || payload.walletAddress;
        const signature = payload.signature;
        const message = payload.statement || payload.message || 'Inicia sesion en Frexland y Blockdrop';

        if (!walletAddress) {
          throw new Error("No se pudo obtener la dirección de billetera de World App.");
        }

        btn.innerHTML = '⏳ Iniciando sesión...';
        await loginWithWorld(walletAddress, message, signature);

        showToast('¡Bienvenido a Frexland!', 'success');
        checkAndShowWinnerModal();
        window.location.hash = '#/home';
      } catch (err) {
        console.error("Error en World Login:", err);
        showToast(err.message || 'Error al conectar con World App', 'error');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  }
}
