import { logout } from '../services/auth.js';

export function checkAndShowTermsModal(onAccept) {
  if (localStorage.getItem('blockdrop_terms_accepted') === 'true') {
    if (onAccept) onAccept();
    return;
  }

  // Create modal container
  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 26, 0.95);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
  `;

  overlay.innerHTML = `
    <div class="card card-glass" style="width: 100%; max-width: 550px; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-lg); max-height: 90vh;">
      
      <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);">
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 1px; margin: 0;">
          ⚖️ TÉRMINOS Y PRIVACIDAD
        </h2>
        <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 4px 0 0 0;">
          Por favor, lee y acepta los términos para continuar
        </p>
      </div>

      <!-- Scrollable Terms Box -->
      <div id="terms-scroll-box" style="flex: 1; overflow-y: auto; padding: var(--space-md); background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.8rem; line-height: 1.6; color: var(--text-secondary); text-align: justify; max-height: 40vh;">
        <h3 style="color: #fff; font-size: 0.95rem; margin-top: 0; font-family: var(--font-display);">1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
        <p>Al acceder y utilizar BlockDrop, usted acepta regirse por estos Términos y Condiciones y nuestra Política de Privacidad. Si no está de acuerdo, no podrá acceder al servicio ni participar en las dinámicas del juego.</p>
        
        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">2. DESCRIPCIÓN DEL JUEGO</h3>
        <p>BlockDrop es un juego de destreza web3 basado en Tetris. Cuenta con un sistema de pozo de recompensas DeFi financiado por los aportes de staking de los usuarios. Los intereses generados por dicho pool se distribuyen semanalmente entre los mejores puntajes del ranking.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">3. RIESGOS DEFI Y CRIPTOMONEDAS</h3>
        <p>La interacción con contratos inteligentes, billeteras Web3 y criptomonedas (tales como USDC) conlleva riesgos financieros inherentes de pérdida de capital, errores en transacciones o fallos de red. BlockDrop no se responsabiliza por pérdidas monetarias causadas por fallos técnicos de terceras partes o descuidos del usuario.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">4. VERIFICACIÓN DE HUMANIDAD (WORLD ID)</h3>
        <p>Para garantizar una competencia justa libre de bots y cuentas duplicadas, los usuarios en puestos elegibles para premios podrían requerir una verificación de humanidad mediante World ID. La falta de verificación resultará en la ineligibilidad para el cobro del premio DeFi semanal.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">5. POLÍTICA DE PRIVACIDAD Y DATOS</h3>
        <p>Para proteger su privacidad, no recopilamos ni almacenamos ningún dato sensible de identidad civil (como nombres o teléfonos). Almacenamos únicamente su dirección de billetera pública, información de redes sociales opcionales (Twitter/X, Discord, Telegram) aportadas de forma voluntaria para verificación de tareas, y su puntuación de juego para el ranking.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">6. MODIFICACIONES</h3>
        <p>BlockDrop se reserva el derecho de modificar estos términos en cualquier momento. Es responsabilidad del usuario revisar periódicamente estas políticas. El uso continuo del juego implica la aceptación incondicional de los nuevos términos establecidos.</p>
        
        <p style="margin-bottom: 0; font-weight: bold; color: var(--neon-cyan); text-align: center; margin-top: var(--space-lg);">🏆 ¡HAS LLEGADO AL FINAL! YA PUEDES ACEPTAR LOS TÉRMINOS.</p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: var(--space-md); width: 100%; margin-top: var(--space-sm);">
        <button class="btn btn-secondary" id="btn-terms-decline" style="flex: 1; font-size: 0.85rem; padding: 10px;">
          ❌ Rechazar
        </button>
        <button class="btn btn-primary" id="btn-terms-accept" disabled style="flex: 1; font-size: 0.85rem; padding: 10px; opacity: 0.5; cursor: not-allowed; transition: all 0.2s ease;">
          🛡️ Aceptar y Continuar
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const scrollBox = overlay.querySelector('#terms-scroll-box');
  const acceptBtn = overlay.querySelector('#btn-terms-accept');
  const declineBtn = overlay.querySelector('#btn-terms-decline');

  // Scroll listener to activate the Accept button
  const checkScroll = () => {
    if (!scrollBox || !acceptBtn) return;
    const threshold = 10; //px from bottom
    const isAtBottom = scrollBox.scrollHeight - scrollBox.scrollTop <= scrollBox.clientHeight + threshold;
    if (isAtBottom) {
      acceptBtn.disabled = false;
      acceptBtn.style.opacity = '1';
      acceptBtn.style.cursor = 'pointer';
      acceptBtn.style.boxShadow = 'var(--shadow-neon-cyan)';
    }
  };

  scrollBox.addEventListener('scroll', checkScroll);
  // Also check if text is already completely visible (small screens/resolutions)
  setTimeout(checkScroll, 300);

  // Decline action
  declineBtn.addEventListener('click', () => {
    overlay.remove();
    logout();
    window.location.hash = '#/auth';
  });

  // Accept action
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('blockdrop_terms_accepted', 'true');
    overlay.remove();
    if (onAccept) onAccept();
  });
}

export function showTermsOnlyModal() {
  // Create view-only modal for footer link clicks
  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 26, 0.95);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
  `;

  overlay.innerHTML = `
    <div class="card card-glass" style="width: 100%; max-width: 550px; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-lg); max-height: 90vh; position: relative;">
      
      <button id="btn-terms-close" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: var(--text-muted); font-size: 1.25rem; cursor: pointer; hover: color: #fff;">✕</button>

      <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);">
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 1px; margin: 0;">
          ⚖️ TÉRMINOS Y PRIVACIDAD
        </h2>
      </div>

      <!-- Scrollable Terms Box -->
      <div style="flex: 1; overflow-y: auto; padding: var(--space-md); background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary); text-align: justify; max-height: 50vh;">
        <h3 style="color: #fff; font-size: 0.95rem; margin-top: 0; font-family: var(--font-display);">1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
        <p>Al acceder y utilizar FrexLand, usted acepta regirse por estos Términos y Condiciones y nuestra Política de Privacidad. Si no está de acuerdo, no podrá acceder al servicio.</p>
        
        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">2. DESCRIPCIÓN DEL JUEGO</h3>
        <p>FrexLand es un portal arcade web3 multiplataforma. Cuenta con un sistema de pozo de recompensas DeFi financiado por los aportes de staking de los usuarios. Los intereses generados por dicho pool se distribuyen semanalmente entre los mejores puntajes del ranking.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">3. RIESGOS DEFI Y CRIPTOMONEDAS</h3>
        <p>La interacción con contratos inteligentes, billeteras Web3 y criptomonedas (tales como USDC) conlleva riesgos financieros inherentes de pérdida de capital, errores en transacciones o fallos de red. FrexLand no se responsabiliza por pérdidas monetarias causadas por fallos técnicos de terceras partes o descuidos del usuario.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">4. VERIFICACIÓN DE HUMANIDAD (WORLD ID)</h3>
        <p>Para garantizar una competencia justa libre de bots y cuentas duplicadas, los usuarios en puestos elegibles para premios podrían requerir una verificación de humanidad mediante World ID. La falta de verificación resultará en la ineligibilidad para el cobro del premio DeFi semanal.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">5. POLÍTICA DE PRIVACIDAD Y DATOS</h3>
        <p>Para proteger su privacidad, no recopilamos ni almacenamos ningún dato sensible de identidad civil (como nombres o teléfonos). Almacenamos únicamente su dirección de billetera pública, información de redes sociales opcionales (Twitter/X, Discord, Telegram) aportadas de forma voluntaria para verificación de tareas, y su puntuación de juego para el ranking.</p>

        <h3 style="color: #fff; font-size: 0.95rem; margin-top: var(--space-md); font-family: var(--font-display);">6. MODIFICACIONES</h3>
        <p>FrexLand se reserva el derecho de modificar estos términos en cualquier momento. Es responsabilidad del usuario revisar periódicamente estas políticas. El uso continuo del juego implica la aceptación incondicional de los nuevos términos establecidos.</p>
      </div>

      <div style="width: 100%; text-align: center; margin-top: var(--space-sm);">
        <button class="btn btn-primary" id="btn-terms-ok" style="width: 100%; max-width: 200px; font-size: 0.85rem; padding: 10px;">
          Entendido
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#btn-terms-close');
  const okBtn = overlay.querySelector('#btn-terms-ok');

  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  okBtn.addEventListener('click', close);
}
