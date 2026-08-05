import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderFaqPage(container) {
  container.innerHTML = `
    <style>
      .faq-details {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        margin-bottom: 20px;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .faq-details[open] {
        background: rgba(255, 255, 255, 0.06);
      }
      .faq-summary {
        padding: 25px;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        list-style: none; /* Hide default arrow in webkit */
        margin: 0;
      }
      /* Hide default arrow in Firefox */
      .faq-summary::-webkit-details-marker {
        display: none;
      }
      .faq-summary::after {
        content: '▼';
        font-size: 0.9rem;
        transition: transform 0.3s ease;
        opacity: 0.7;
      }
      .faq-details[open] .faq-summary::after {
        transform: rotate(180deg);
      }
      .faq-content {
        padding: 0 25px 25px 25px;
        color: var(--text-secondary);
        line-height: 1.6;
        text-align: justify;
      }
    </style>
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh;">
      <div class="card-glass" style="max-width: 900px; width: 90%; margin: 60px 20px; padding: 60px; text-align: left; position: relative; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 4rem; margin-bottom: 20px; text-align: center; animation: float 3s ease-in-out infinite;">❓</div>
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 40px; text-align: center;">Preguntas Frecuentes</h2>

        <div style="display: flex; flex-direction: column; width: 100%;">
          
          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">1. ¿Qué es Web3 y por qué lo usamos?</summary>
            <div class="faq-content">
              Web3 es la evolución del internet, donde las plataformas no están controladas por una sola empresa, sino que funcionan mediante la tecnología Blockchain. Lo usamos para garantizar que tu dinero, tus puntajes y las recompensas del juego sean 100% transparentes, seguras y de tu propiedad.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">2. ¿Qué es una "Billetera" o Wallet?</summary>
            <div class="faq-content">
              Una billetera (como MetaMask, Phantom o Coinbase Wallet) es como tu cuenta de banco personal para el mundo cripto. Te permite iniciar sesión en juegos, guardar tus fondos (USDC) y recibir tus premios directamente sin intermediarios.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">3. ¿Cómo crear una billetera y depositar fondos para participar?</summary>
            <div class="faq-content">
              <p style="margin-top: 0;">Para empezar, necesitas instalar una billetera (recomendamos MetaMask), conectarla a la red Base y enviarle fondos (USDC y un poco de ETH para las comisiones).</p>
              <p>Si es tu primera vez, puedes comprar criptomonedas fácilmente en <strong>Binance</strong> y enviarlas a tu billetera personal.</p>
              <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-AR&ref=GRO_28502_IWZRB&utm_source=referral_entrance" target="_blank" class="btn btn-primary btn-sm" style="display: inline-block; text-decoration: none; margin-bottom: 20px;">👉 Crear cuenta en Binance (Link de Referido)</a>
              <div style="background: #000; border-radius: 8px; padding: 20px; text-align: center; border: 1px dashed var(--border-color);">
                <p style="color: #666; margin: 0;">[AQUÍ VA TU VIDEO DE YOUTUBE EXPLICATIVO]</p>
                <!-- <iframe width="100%" height="315" src="https://www.youtube.com/embed/TU_ID_DE_VIDEO" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> -->
              </div>
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">4. ¿Qué es USDC y por qué se usa?</summary>
            <div class="faq-content">
              USDC es una "moneda estable" (stablecoin) que siempre vale exactamente 1 Dólar Estadounidense. Lo usamos para que el valor de tus depósitos y premios no varíe bruscamente, dándote estabilidad financiera.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">5. ¿Es seguro conectar mi billetera al juego?</summary>
            <div class="faq-content">
              Sí, 100% seguro. Al conectar tu billetera solo nos das permiso para "ver" tu dirección pública y tu saldo. Nunca podremos retirar ni mover tus fondos sin tu firma y autorización explícita para cada transacción.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">6. ¿Cómo gano dinero jugando a BlockDrop?</summary>
            <div class="faq-content">
              Para ganar dinero, necesitas depositar USDC en el juego (lo que te da créditos), usar esos créditos para registrar tus mejores puntajes, y lograr quedar entre los **3 mejores jugadores de la semana** (Top 3).
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">7. ¿De dónde salen los premios que se reparten cada semana?</summary>
            <div class="faq-content">
              El USDC depositado por todos los jugadores se invierte automáticamente de forma segura en un protocolo llamado **Aave**, que genera intereses diariamente. El premio semanal es el 70% de todo ese interés generado. Es decir, los premios salen del rendimiento del dinero, no de pérdidas de otros jugadores.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">8. ¿Puedo retirar mi dinero inicial cuando quiera?</summary>
            <div class="faq-content">
              Sí, tu depósito siempre te pertenece. Si decides dejar de jugar, puedes ir a la sección "Wallet" y solicitar el retiro total o parcial de tus USDC. Por seguridad de la plataforma, el retiro se procesa y libera tras un período de 24 horas.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">9. ¿Qué pasa si pierdo todas mis partidas, pierdo mis fondos?</summary>
            <div class="faq-content">
              ¡No! En BlockDrop no pierdes tu depósito inicial por jugar mal. Cada partida que registras consume un "crédito" (obtenido por depositar), pero tu capital depositado sigue intacto y generando intereses para el pozo general. Lo peor que puede pasar es que no ganes premios esa semana, pero tu dinero sigue ahí.
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">10. ¿Necesito pagar comisiones (gas) por jugar?</summary>
            <div class="faq-content">
              Solo necesitas pagar gas (en ETH de la red Base) cuando depositas fondos o cuando retiras fondos, ya que esas son transacciones en la Blockchain. El registro de puntajes diarios y jugar no requiere pagar comisiones adicionales de red.
            </div>
          </details>

        </div>
      </div>
    </div>
  `;

  renderNavbar(container.querySelector('#navbar-container'), 'faq');
  
  // Attach footer
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);
}
