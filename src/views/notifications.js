import { t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderNotificationsPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding-bottom: var(--space-2xl);">
      <div style="max-width: 920px; width: 95%; margin: 40px auto; display: flex; flex-direction: column; gap: var(--space-xl); box-sizing: border-box;">
        
        <!-- Header Section -->
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 12px; animation: float 3s ease-in-out infinite;">📢</div>
          <h1 class="text-gradient text-glow" style="font-family: var(--font-display); font-size: clamp(1.8rem, 5vw, 2.6rem); margin-bottom: 8px;">
            Novedades del Proyecto
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 600px; margin: 0 auto; line-height: 1.5;">
            Descubre las últimas actualizaciones de la plataforma, nuevos sistemas de recompensas y anuncios oficiales de FrexLand.
          </p>
        </div>

        <!-- Featured Announcement Card -->
        <div class="card card-glass" style="border: 1.5px solid var(--neon-cyan); box-shadow: 0 0 25px rgba(0, 245, 255, 0.15); padding: clamp(20px, 4vw, 36px); border-radius: 16px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink));"></div>
          
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="background: rgba(0, 245, 255, 0.15); color: var(--neon-cyan); border: 1px solid rgba(0, 245, 255, 0.4); font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                🚀 Lanzamiento Oficial
              </span>
              <span style="background: rgba(0, 255, 136, 0.15); color: var(--neon-green); border: 1px solid rgba(0, 255, 136, 0.4); font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                🟢 Fin del Mantenimiento
              </span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">
              Septiembre 2026
            </span>
          </div>

          <h2 style="color: #fff; font-family: var(--font-display); font-size: clamp(1.2rem, 3.5vw, 1.7rem); margin-bottom: 16px; line-height: 1.3;">
            ¡Presentamos el Sistema de Niveles de Jugador y Renovación Semanal de Créditos!
          </h2>

          <p style="color: var(--text-secondary); line-height: 1.7; font-size: 0.95rem; margin-bottom: 20px;">
            Nos emociona anunciar la culminación exitosa de las tareas de mantenimiento y el despliegue de una gran actualización diseñada para recompensar a los jugadores y fortalecer la liquidez de todo el ecosistema de FrexLand.
          </p>

          <!-- Highlights Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 24px;">
            
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.2rem; margin-bottom: 6px;">⚡ <strong>100% Operativo</strong></div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                Fin de mantenimiento aplicado en todas las plataformas: Navegador Web, Móviles, World App MiniKit y Lemon Cash.
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.2rem; margin-bottom: 6px;">⏳ <strong>Renovación Semanal</strong></div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                Los créditos se renuevan automáticamente cada semana tras el cierre de la cuenta regresiva y la entrega de premios del pozo (Jueves 00:00 UTC).
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.2rem; margin-bottom: 6px;">🌐 <strong>Bono World ID</strong></div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                Los usuarios con verificación de humanidad World ID Orb reciben <strong>+1 crédito semanal extra</strong> de por vida.
              </p>
            </div>

          </div>

          <!-- Tiers Breakdown Box -->
          <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <h3 style="color: var(--neon-yellow); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px;">
              🏆 Escala de Rangos por Depósito en Aave V3:
            </h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; font-size: 0.85rem;">
                <span>🌱 <strong>Sin Rango</strong> (&lt; 10 USDC)</span>
                <span style="color: var(--text-muted);">0 créditos semanales (práctica libre)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(205, 127, 50, 0.08); border: 1px solid rgba(205, 127, 50, 0.25); border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #cd7f32;">🥉 <strong>Bronce</strong> (≥ 10 y &lt; 50 USDC)</span>
                <span style="color: #fff; font-weight: bold;">1 a 4 créditos/semana</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #cbd5e1;">🥈 <strong>Plata</strong> (≥ 50 y &lt; 100 USDC)</span>
                <span style="color: #fff; font-weight: bold;">5 a 9 créditos/semana</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #facc15;">🥇 <strong>Oro</strong> (≥ 100 y &lt; 500 USDC)</span>
                <span style="color: #fff; font-weight: bold;">10 a 49 créditos/semana</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #22d3ee;">💠 <strong>Platino</strong> (≥ 500 y &lt; 1000 USDC)</span>
                <span style="color: #fff; font-weight: bold;">50 a 99 créditos/semana</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #c084fc;">💎 <strong>Diamante</strong> (≥ 1000 USDC)</span>
                <span style="color: #fff; font-weight: bold;">100+ créditos/semana (Legendario)</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <a href="#/play" class="btn btn-primary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              🎮 Jugar a BlockDrop
            </a>
            <a href="#/wallet" class="btn btn-secondary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              💳 Ir a mi Billetera
            </a>
            <a href="#/whitepaper" class="btn btn-secondary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              📖 Ver Whitepaper
            </a>
          </div>

        </div>

        <!-- Secondary Announcement Card: Security & Audit -->
        <div class="card card-glass" style="padding: clamp(20px, 3vw, 28px); border-radius: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="background: rgba(168, 85, 247, 0.15); color: var(--neon-purple); border: 1px solid rgba(168, 85, 247, 0.3); font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 12px;">
              🛡️ SEGURIDAD & CONTRATO
            </span>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">
              Base Network
            </span>
          </div>
          <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 8px;">
            Auditoría de Smart Contracts con Slither y Time-Lock de 24 Horas
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; margin: 0;">
            El contrato inteligente oficial en Base ha sido sometido a análisis estático con Slither, garantizando protección total contra ataques de reentrancy, retiro pull-over-push y time-lock de seguridad de 24 horas para todos los depósitos en Aave V3.
          </p>
        </div>

      </div>
    </div>
  `;

  renderNavbar(container.querySelector('#navbar-container'), 'notifications');
  
  // Attach footer
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);
}


