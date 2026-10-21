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
            Descubre las últimas actualizaciones de la plataforma, nuevos sistemas de recompensas, referidos y anuncios oficiales de FrexLand.
          </p>
        </div>

        <!-- NEW FEATURED ANNOUNCEMENT: ECONOMY 2.0, MADERA TIER, DYNAMIC SLOTS & REFERRALS -->
        <div class="card card-glass" style="border: 1.5px solid var(--neon-green); box-shadow: 0 0 28px rgba(57, 255, 20, 0.18); padding: clamp(20px, 4vw, 36px); border-radius: 16px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan), var(--neon-purple));"></div>
          
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="background: rgba(57, 255, 20, 0.15); color: var(--neon-green); border: 1px solid rgba(57, 255, 20, 0.45); font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                🔥 Gran Actualización Económica
              </span>
              <span style="background: rgba(0, 245, 255, 0.15); color: var(--neon-cyan); border: 1px solid rgba(0, 245, 255, 0.4); font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                🌳 Nuevo Rango Madera + Referidos
              </span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">
              Octubre 2026
            </span>
          </div>

          <h2 style="color: #fff; font-family: var(--font-display); font-size: clamp(1.2rem, 3.5vw, 1.7rem); margin-bottom: 14px; line-height: 1.3;">
            ¡Depósitos Libres, Rango Madera, Puestos de Premio Dinámicos, Tabla Global y Sistema de Referidos!
          </h2>

          <p style="color: var(--text-secondary); line-height: 1.7; font-size: 0.95rem; margin-bottom: 20px;">
            Hemos actualizado las reglas económicas de FrexLand para que cualquier jugador pueda participar con cualquier monto, sumando más puestos premiados, un sistema de referidos multinivel y transferencia de créditos entre jugadores.
          </p>

          <!-- Key Updates Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 24px;">
            
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.05rem; margin-bottom: 6px; color: var(--neon-green);">💰 <strong>Reparto Semanal 70% / 30% y Puestos Dinámicos</strong></div>
              <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                El reparto de intereses al finalizar cada semana es siempre <strong>70% para los distintos juegos</strong> (proporcional a la cantidad de grabaciones de puntaje en la tabla de competencia de cada juego) y <strong>30% para el proyecto</strong>.<br><br>
                En cada juego se reparte: <strong>1° Puesto: 50%</strong>, <strong>2° Puesto: 30%</strong>, <strong>3° Puesto: 10%</strong> y el otro <strong>10% repartido entre los primeros 10 siguientes (4° al 13°)</strong>. Cada vez que el menor premio supere los <strong>10 USDC</strong>, se habilitan automáticamente <strong>+10 puestos vacantes más</strong> (20 siguientes, 30 siguientes y así sucesivamente) con aviso y barra de progreso en vivo.
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.05rem; margin-bottom: 6px; color: var(--neon-cyan);">🔓 <strong>Depósitos de Cualquier Cantidad y Tabla Global</strong></div>
              <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                Eliminamos la restricción de múltiplos de 10 USDC: ahora puedes <strong>depositar cualquier cantidad de USDC</strong>.<br><br>
                Además, quienes no depositen figuran como <strong>🌱 Sin Rango</strong> y participan automáticamente en la nueva <strong>Tabla Global de Puntos (Informativa)</strong> de cada juego, donde se registra el mayor puntaje histórico de cada usuario mostrando <strong>Usuario - Puntaje - Rango</strong> sin consumir créditos.
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px;">
              <div style="font-size: 1.05rem; margin-bottom: 6px; color: #d97706;">🌳 <strong>Nuevo Rango Madera (1 a 9.99 USDC)</strong></div>
              <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                Los depósitos desde <strong>1 hasta 9.99 USDC</strong> (sin incluir 10) activan el <strong>Rango Madera</strong> con <strong>1 crédito semanal</strong>.<br><br>
                Si un jugador en Rango Madera gana un puesto en el torneo, recibe un premio proporcional a su depósito: <strong>1 USDC = 10% del premio, 3 USDC = 30%, 5 USDC = 50%</strong>, etc. El porcentaje restante del premio se deposita al proyecto / administrador. A partir de <strong>Bronce (≥ 10 USDC)</strong> se mantiene 1 crédito cada 10 USDC (sin sumar el crédito de Madera) y se cobra el <strong>100% del premio</strong>.
              </p>
            </div>

          </div>

          <!-- Tiers, Referrals & Credit Transfer Box -->
          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <h3 style="color: var(--neon-yellow); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px;">
              🤝 Nueva Escala de Rangos, Comisiones de Referidos y Transferencia de Créditos:
            </h3>
            <p style="font-size: 0.83rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
              A partir de <strong>Bronce (≥ 10 USDC)</strong> puedes generar tu código de referido en tu Perfil. Al finalizar el torneo semanal, si tus referidos (que sean <strong>Bronce o mayor</strong>) ganan un premio, recibes una comisión según tu rango al momento de repartir los premios (descontada de la recompensa del ganador):
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; font-size: 0.84rem;">
                <span>🌱 <strong>Sin Rango</strong> (&lt; 1 USDC)</span>
                <span style="color: var(--text-muted);">0 créditos/sem • Participa en Tabla Global de Puntos</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(217, 119, 6, 0.1); border: 1px solid rgba(217, 119, 6, 0.35); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #d97706;">🌳 <strong>Madera</strong> (1 a 9.99 USDC)</span>
                <span style="color: #fff; font-weight: bold;">1 crédito/sem • Premio proporcional (10% por cada 1 USDC)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(205, 127, 50, 0.08); border: 1px solid rgba(205, 127, 50, 0.25); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #cd7f32;">🥉 <strong>Bronce</strong> (10 a 49.99 USDC)</span>
                <span style="color: #fff; font-weight: bold;">1 a 4 créd/sem (1 c/10 USDC) • 100% Premio + Código de Referido</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #cbd5e1;">🥈 <strong>Plata</strong> (50 a 99.99 USDC)</span>
                <span style="color: #fff; font-weight: bold;">5 a 9 créd/sem • Gana 1% del premio de sus referidos directos (Bronce+)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #facc15;">🥇 <strong>Oro</strong> (100 a 499.99 USDC)</span>
                <span style="color: #fff; font-weight: bold;">10 a 49 créd/sem • Gana 3% de referidos + Transferir Créditos a referidos</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #22d3ee;">💠 <strong>Platino</strong> (500 a 999.99 USDC)</span>
                <span style="color: #fff; font-weight: bold;">50 a 99 créd/sem • Gana 5% Ref. Directo + 1% Ref. de Referido + Transferir Créditos</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 8px; font-size: 0.84rem;">
                <span style="color: #c084fc;">💎 <strong>Diamante</strong> (≥ 1000 USDC)</span>
                <span style="color: #fff; font-weight: bold;">100+ créd/sem • Gana 5% Ref. Directo + 3% Ref. de Referido + Transferir Créditos</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <a href="#/blockdrop" class="btn btn-primary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              🏆 Ver Tablas y Pozo
            </a>
            <a href="#/profile" class="btn btn-secondary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              🤝 Mi Código de Referido
            </a>
            <a href="#/wallet" class="btn btn-secondary" style="text-decoration: none; padding: 10px 20px; font-size: 0.88rem;">
              💳 Ir a mi Billetera
            </a>
          </div>
        </div>

        <!-- Previous Announcement Card -->
        <div class="card card-glass" style="border: 1.5px solid var(--neon-cyan); box-shadow: 0 0 25px rgba(0, 245, 255, 0.12); padding: clamp(20px, 4vw, 32px); border-radius: 16px; position: relative; overflow: hidden;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
            <span style="background: rgba(0, 245, 255, 0.15); color: var(--neon-cyan); border: 1px solid rgba(0, 245, 255, 0.4); font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
              🚀 Lanzamiento Oficial & World ID
            </span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">
              Septiembre 2026
            </span>
          </div>
          <h3 style="color: #fff; font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 10px;">
            Renovación Semanal de Créditos y Bono World ID Orb
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin: 0;">
            Los créditos se renuevan automáticamente cada semana tras el cierre de la cuenta regresiva y la entrega de premios del pozo (Jueves 00:00 UTC). Además, los usuarios verificados con World ID Orb reciben <strong>+1 crédito semanal extra</strong>.
          </p>
        </div>

        <!-- Security & Audit Card -->
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
  
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);
}
