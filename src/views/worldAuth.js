import { t } from '../utils/i18n.js';
import { authenticateWorld } from '../web3/world.ts';
import { loginWithWorld } from '../services/auth.js';
import { showToast } from '../main.js';
import { checkAndShowWinnerModal } from '../components/winnerModal.js';

export function renderWorldAuthPage(container) {
  container.innerHTML = `
    <div class="auth-page" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="auth-container" style="max-width: 440px; width: 100%;">
        <div class="auth-logo" style="text-align: center; margin-bottom: 24px;">
          <span class="auth-logo-icon" style="font-size: 3.5rem; display: block;">🕹️</span>
          <div class="auth-logo-text" style="font-family: 'Press Start 2P', cursive; font-size: 1.8rem; color: var(--neon-cyan); text-shadow: 4px 4px 0 var(--neon-magenta), 8px 8px 0 var(--neon-purple); margin-top: 10px;">FREXLAND</div>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 245, 255, 0.1); border: 1px solid rgba(0, 245, 255, 0.3); padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; color: var(--neon-cyan); margin-top: 14px; font-weight: 600; font-family: var(--font-ui);">
            <span>🌍</span> World App Edition
          </div>
        </div>

        <div class="card card-glass" style="border: 2px solid var(--border-glow); background: rgba(15, 15, 30, 0.95); border-radius: var(--radius-lg); padding: 32px 24px; box-shadow: 0 0 40px rgba(0, 245, 255, 0.2); text-align: center;">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🔑</div>
          <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.35rem; margin-bottom: 12px; line-height: 1.3;">
            Confirmar Billetera e Iniciar Sesión
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px;">
            Detectamos tu acceso desde <strong>World App</strong>. Conecta tu billetera para ingresar directamente a los juegos y competir por el pozo semanal.
          </p>

          <button class="btn btn-primary btn-lg btn-full" id="btn-world-login-direct" style="height: 52px; font-size: 1rem; font-family: var(--font-display); box-shadow: var(--shadow-glow-cyan); display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px;">
            <span>🌐</span> Conectar e Iniciar Sesión
          </button>

          <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
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
