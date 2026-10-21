import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderWhitepaperPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; min-height: 100vh;">
      
      <!-- GitBook Style Layout -->
      <div style="display: flex; flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; padding-top: 40px;">
        
        <!-- Sidebar Navigation -->
        <div style="width: 250px; padding: 20px; border-right: 1px solid var(--border-color); display: none; @media (min-width: 768px) { display: block; }">
          <h3 style="color: var(--neon-cyan); margin-bottom: 20px; font-family: var(--font-display);">FrexLand</h3>
          <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 15px;">
            <li><a href="#intro" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">1. Introducción</a></li>
            <li><a href="#interfaz" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">2. Guía de Interfaz</a></li>
            <li><a href="#juegos" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">3. Juegos y Tablas</a></li>
            <li><a href="#niveles" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">4. Niveles y Referidos</a></li>
            <li><a href="#finanzas" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">5. Finanzas y Premios</a></li>
            <li><a href="#objetivos" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">6. Objetivos del Proyecto</a></li>
            <li><a href="#equipo" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">7. El Equipo</a></li>
            <li><a href="#seguridad" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">8. Seguridad y Contratos</a></li>
            <li><a href="#worldapp" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">9. World App & World ID</a></li>
          </ul>
        </div>

        <!-- Main Content Area -->
        <div class="whitepaper-content" style="flex: 1; padding: 40px; width: 100%; line-height: 1.8; color: var(--text-secondary); font-size: 1.05rem; text-align: justify;">
          <h1 style="color: #fff; font-size: 2.5rem; margin-bottom: 10px; font-family: var(--font-display);">Whitepaper</h1>
          <p style="margin-bottom: 40px; font-size: 1.2rem; color: var(--neon-cyan);">Documentación Oficial de FrexLand & BlockDrop</p>

          <section id="intro" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">1. Introducción</h2>
            <p>Bienvenidos a <strong>FrexLand</strong>. Nuestro ecosistema busca revolucionar la forma en la que los jugadores interactúan con los videojuegos y la tecnología Blockchain. A través de la integración de protocolos de finanzas descentralizadas (DeFi) como Aave, los jugadores no solo compiten, sino que generan valor real mientras se divierten.</p>
          </section>

          <section id="interfaz" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">2. Guía de Interfaz (Pantallas y Secciones)</h2>
            <p>Para garantizar que tu experiencia sea fluida, aquí explicamos cada uno de los componentes de la plataforma.</p>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Barra de Navegación (Navbar)</h3>
            <div style="width:100%; margin: 15px 0; text-align: center;">
              <img src="/assets/images/navbar.png" alt="Barra de Navegación" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            </div>
            <p>El Navbar es tu centro de control en todo momento. Desde aquí puedes acceder rápidamente a:</p>
            <ul>
              <li style="margin-bottom: 10px;"><strong>Jugar:</strong> Te dirige a BlockDrop.</li>
              <li style="margin-bottom: 10px;"><strong>Leaderboard (Competencia y Global):</strong> Tabla de posiciones semanal por premios y tabla global informativa actualizada en tiempo real con niveles e insignias.</li>
              <li style="margin-bottom: 10px;"><strong>Billetera:</strong> Sección para gestionar tus depósitos libres de USDC y tus retiros.</li>
              <li style="margin-bottom: 10px;"><strong>Información de Créditos:</strong> En la parte derecha verás tu saldo de USDC y de Créditos semanales disponibles.</li>
              <li style="margin-bottom: 10px;"><strong>Menú de Perfil (Avatar):</strong> Al hacer clic en tu insignia de nivel o avatar, accedes a tu rango de jugador, barra de progreso al siguiente nivel, sistema de referidos y transferencia de créditos.</li>
            </ul>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Conexión de Cuenta y Perfil</h3>
            <div style="width:100%; margin: 15px 0; text-align: center;">
              <img src="/assets/images/login.png" alt="Menú de Conexión" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            </div>
            <p>La plataforma ofrece múltiples vías de registro (Correo/Contraseña, Google o World App). Una vez dentro de tu perfil, la seguridad de las cuentas es estricta: un medio de conexión no sobrescribe a otro y tu sesión está protegida mediante almacenamiento temporal.</p>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Botones de Juego, Tabla Global y Puntaje de Competencia</h3>
            <div style="width:100%; margin: 15px 0; text-align: center;">
              <img src="/assets/images/game.png" alt="Menú del Juego BlockDrop" style="max-width: 100%; max-height: 500px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            </div>
            <p>Al terminar una partida en BlockDrop, tu mejor puntaje histórico se registra automáticamente en la <strong>Tabla Global de Puntos (Informativa)</strong> sin gastar créditos. Además, si deseas competir por el pozo semanal de premios en USDC, puedes inscribir tu puntaje en la <strong>Tabla de Competencia</strong> desde la sección <strong>Registro</strong> utilizando 1 crédito.</p>
          </section>

          <section id="juegos" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">3. Juegos y Tablas (Competencia vs. Global)</h2>
            <p><strong>BlockDrop</strong> es el primer juego insignia de FrexLand. Cada juego cuenta con dos tablas diferenciadas:</p>
            <ul>
              <li style="margin-bottom: 10px;"><strong>🏆 Tabla de Competencia (Torneo Semanal):</strong> Exclusiva para quienes inscriben su puntaje usando 1 crédito semanal. Compite por el 70% de los intereses semanales de Aave V3.</li>
              <li style="margin-bottom: 10px;"><strong>🌍 Tabla Global de Puntos (Informativa por Juego):</strong> Registra automáticamente el mayor puntaje histórico de cada usuario (incluyendo usuarios <em>Sin Rango</em> que no hayan depositado), mostrando <strong>Usuario - Puntaje - Rango</strong>.</li>
              <li style="margin-bottom: 10px;"><strong>Depósitos Libres:</strong> Puedes depositar cualquier cantidad de USDC sin restricción de múltiplos de 10.</li>
            </ul>
          </section>

          <section id="niveles" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">4. Sistema de Niveles, Referidos y Transferencia de Créditos</h2>
            <p>FrexLand cuenta con un <strong>Sistema de Rangos por Depósito</strong> en USDC en Aave V3 que determina tus créditos semanales, el porcentaje de premio recibido y las comisiones por referidos:</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin: 25px 0;">
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">🌱</span>
                  <strong style="color: #94a3b8; font-size: 1.05rem;">Sin Rango</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>&lt; 1 USDC</strong><br>Créditos semanales: <strong>0 créditos</strong>.<br>Participa en la Tabla Global de Puntos informativa.</p>
              </div>

              <div style="background: rgba(217, 119, 6, 0.08); border: 1px solid rgba(217, 119, 6, 0.35); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">🌳</span>
                  <strong style="color: #d97706; font-size: 1.05rem;">Nivel Madera</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>1 a 9.99 USDC (sin incluir 10)</strong><br>Créditos semanales: <strong>1 crédito</strong>.<br>Premio proporcional al depósito: <strong>1 USDC = 10%, 3 USDC = 30%, etc.</strong> El resto del premio se deposita al proyecto / administrador.</p>
              </div>

              <div style="background: rgba(205, 127, 50, 0.05); border: 1px solid rgba(205, 127, 50, 0.3); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">🥉</span>
                  <strong style="color: #cd7f32; font-size: 1.05rem;">Nivel Bronce</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>10 a 49.99 USDC</strong><br>Créditos semanales: <strong>1 a 4 créditos (1 cada 10 USDC)</strong>.<br>Gana el <strong>100% del premio</strong> y habilita generar <strong>Código de Referido</strong>.</p>
              </div>

              <div style="background: rgba(148, 163, 184, 0.06); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">🥈</span>
                  <strong style="color: #cbd5e1; font-size: 1.05rem;">Nivel Plata</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>50 a 99.99 USDC</strong><br>Créditos semanales: <strong>5 a 9 créditos</strong>.<br>Recibe el <strong>1%</strong> de lo que ganen sus referidos directos (Bronce+).</p>
              </div>

              <div style="background: rgba(234, 179, 8, 0.06); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">🥇</span>
                  <strong style="color: #facc15; font-size: 1.05rem;">Nivel Oro</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>100 a 499.99 USDC</strong><br>Créditos semanales: <strong>10 a 49 créditos</strong>.<br>Recibe el <strong>3%</strong> de referidos directos y puede <strong>transferir sus créditos a sus referidos</strong>.</p>
              </div>

              <div style="background: rgba(34, 211, 238, 0.06); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">💠</span>
                  <strong style="color: #22d3ee; font-size: 1.05rem;">Nivel Platino</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>500 a 999.99 USDC</strong><br>Créditos semanales: <strong>50 a 99 créditos</strong>.<br>Recibe el <strong>5%</strong> de referidos directos + <strong>1%</strong> de referidos de referidos (N2) + transferencia de créditos.</p>
              </div>

              <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 8px; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 1.3rem;">💎</span>
                  <strong style="color: #c084fc; font-size: 1.05rem;">Nivel Diamante</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Depósito: <strong>1000+ USDC</strong><br>Créditos semanales: <strong>100+ créditos</strong>.<br>Recibe el <strong>5%</strong> de referidos directos + <strong>3%</strong> de referidos de referidos (N2) + transferencia de créditos.</p>
              </div>

            </div>

            <div style="background: rgba(0, 245, 255, 0.05); border-left: 4px solid var(--neon-cyan); border-radius: 8px; padding: 15px; margin-top: 15px;">
              <h4 style="color: var(--neon-cyan); margin-top: 0;">Reglas de Créditos y Comisiones de Referidos</h4>
              <p style="margin-bottom: 0;">• En <strong>Madera (1 a &lt;10 USDC)</strong> recibes 1 crédito semanal. Desde <strong>Bronce (≥ 10 USDC)</strong> se mantiene <strong>1 crédito cada 10 USDC</strong> (<code>⌊Depósito / 10⌋</code>, sin sumar crédito extra de Madera), más <code>+1 crédito</code> si verificaste World ID.<br>
              • Las comisiones de referidos se aplican al finalizar el torneo semanal siempre y cuando los ganadores de premios sean <strong>Bronce o superior (≥ 10 USDC)</strong>, evaluando el rango del referente en el momento de repartir los premios y descontándose de la recompensa del ganador.</p>
            </div>
          </section>

          <section id="finanzas" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">5. Finanzas, Distribución de Premios y Puestos Dinámicos</h2>
            <p>Todo el USDC depositado por los usuarios se suministra de forma transparente al pool de liquidez en Aave V3 (Base Network), generando intereses constantemente.</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid var(--neon-cyan);">
              <h4 style="color: var(--neon-cyan); margin-top: 0;">Distribución Semanal de Intereses (70% Juegos / 30% Proyecto)</h4>
              <p style="margin-bottom: 0;">Cada semana, al finalizar la cuenta regresiva (Jueves 00:00 UTC), los intereses generados se reparten:<br>
              • <strong>70% para los distintos juegos:</strong> Se asigna proporcionalmente a cada juego de acuerdo a la cantidad de grabaciones de puntaje en su tabla de competencia semanal.<br>
              • <strong>30% para el Proyecto:</strong> Se deposita al proyecto / desarrollo al finalizar cada semana.<br><br>
              <strong>Reparto dentro de cada juego:</strong><br>
              • <strong>🥇 1° Puesto:</strong> 50% del pozo del juego.<br>
              • <strong>🥈 2° Puesto:</strong> 30% del pozo del juego.<br>
              • <strong>🥉 3° Puesto:</strong> 10% del pozo del juego.<br>
              • <strong>🏅 Siguientes Puestos (4° al 13°+):</strong> El otro <strong>10%</strong> se reparte en partes iguales entre los primeros 10 siguientes (puestos 4° al 13°). Si el premio para cada uno de esos 10 puestos supera los <strong>10 USDC</strong>, se habilitan automáticamente <strong>+10 puestos adicionales con resultados vacíos</strong> (20 siguientes, 30 siguientes, y así sucesivamente cada vez que el menor premio supere los 10 USDC).</p>
            </div>
            <p><strong>Retiros Seguros:</strong> Tu depósito inicial siempre es tuyo. Puedes solicitar su retiro, el cual tiene un período de seguridad y confirmación de 24 horas para proteger el capital del pool contra ataques de manipulación.</p>
          </section>

          <section id="objetivos" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">6. Objetivos del Proyecto</h2>
            <p>A corto plazo, buscamos consolidar la comunidad de BlockDrop y probar la escalabilidad del sistema económico en la red Base.</p>
            <p>A mediano y largo plazo, FrexLand será el hub de múltiples juegos competitivos, torneos, NFTs cosméticos y asociaciones con otros protocolos DeFi, creando la primera economía de <em>Play-and-Earn</em> verdaderamente sostenible.</p>
          </section>

          <section id="equipo" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">7. El Equipo</h2>
            <p>Por ahora, el proyecto está siendo desarrollado íntegramente por un desarrollador independiente en conjunto con los potentes agentes de inteligencia artificial de <strong>Antigravity</strong> (Google DeepMind).</p>
            <p>Nuestra visión es construir la plataforma más transparente y divertida de la Web3. Si deseas formar parte del equipo, tienes talento y quieres sumar al proyecto, no dudes en visitar la sección de <strong><a href="#/contact" style="color: var(--neon-pink); text-decoration: none; font-weight: bold;">Contacto</a></strong>.</p>
          </section>

          <section id="seguridad" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">8. Seguridad y Contratos (Auditoría)</h2>
            <p>La transparencia y seguridad de los fondos son el pilar más crítico de FrexLand. Nuestro contrato inteligente (Smart Contract) corre sobre la blockchain de <strong>Base</strong>.</p>
            <div style="background: rgba(0, 245, 255, 0.05); border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px; overflow-wrap: break-word;">
              <strong style="color: var(--neon-cyan);">Contrato Oficial (Base Network):</strong><br>
              <a href="https://basescan.org/address/0xa129A50c3303057eC25780da0f645a977Bbf66bb" target="_blank" style="color: #fff; text-decoration: underline; font-family: monospace; font-size: 1.1rem;">0xa129A50c3303057eC25780da0f645a977Bbf66bb</a>
            </div>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Auditoría con Slither</h3>
            <p>El código del contrato ha sido analizado profundamente utilizando <strong>Slither</strong>, el framework de análisis estático más avanzado para Solidity. Durante el desarrollo y la auditoría, se implementaron las siguientes protecciones de estándar industrial:</p>
            <ul>
              <li style="margin-bottom: 10px;"><strong>Protección contra Reentrancy:</strong> Utilizamos <code>ReentrancyGuard</code> de OpenZeppelin en todas las funciones sensibles para prevenir ataques recursivos.</li>
              <li style="margin-bottom: 10px;"><strong>Patrón "Pull over Push":</strong> El protocolo requiere que los usuarios soliciten su retiro, aislando el riesgo de fallo de un usuario del resto del ecosistema.</li>
              <li style="margin-bottom: 10px;"><strong>Time-Lock de 24 Horas:</strong> Obliga a esperar 24 horas tras solicitar un retiro, neutralizando manipulaciones flash-loan.</li>
              <li style="margin-bottom: 10px;"><strong>Interacción Segura con Aave V3:</strong> Deposita los USDC directamente en Aave V3 utilizando integraciones estándar.</li>
            </ul>
          </section>

          <section id="worldapp" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">9. Integración World App & World ID (Anti-Bots y Mecanismo Cross-Chain)</h2>
            <p>FrexLand ofrece una experiencia de juego limpia y libre de bots gracias a la integración con <strong>World (World App, World Chain y World ID)</strong>.</p>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">9.1. Mini-App en World App (MiniKit)</h3>
            <p>FrexLand funciona como una Mini-App dentro de <strong>World App</strong> mediante el framework oficial <strong>MiniKit</strong>, permitiendo pagos, depósitos libres y verificaciones en un entorno nativo.</p>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">9.2. Verificación de Humanidad (World ID Orb)</h3>
            <ul>
              <li style="margin-bottom: 10px;"><strong>Privacidad Cero-Conocimiento (ZKP):</strong> Garantiza que cada jugador es un humano único sin exponer datos personales.</li>
              <li style="margin-bottom: 10px;"><strong>Crédito Semanal de Humanidad:</strong> Otorga <strong>+1 crédito extra semanal</strong> renovable cada semana tras la distribución de premios.</li>
            </ul>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">9.3. Mecanismo Cross-Chain y Depósitos Libres (World Chain a Base / Aave V3)</h3>
            <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 18px; margin: 20px 0; line-height: 1.6;">
              <h4 style="color: var(--neon-purple); margin-top: 0; margin-bottom: 8px;">Arquitectura de Depósito Libre y Rendimiento:</h4>
              <p style="margin-bottom: 10px;">1. <strong>Depósito de Cualquier Cantidad:</strong> Puedes depositar cualquier monto de USDC (desde 1 USDC para Rango Madera o desde 10 USDC para Rango Bronce y superiores).</p>
              <p style="margin-bottom: 10px;">2. <strong>En World Chain (+0.01 USDC de Fee de Puente):</strong> En World App se adiciona únicamente 0.01 USDC para cubrir el puente cross-chain hacia Base.</p>
              <p style="margin-bottom: 0;">3. <strong>Suministro a Aave V3 y Créditos:</strong> Los fondos se suministran a Aave V3 en Base para generar intereses en aUSDC, activando instantáneamente tu rango (Madera: 1 crédito semanal; Bronce+: 1 crédito semanal cada 10 USDC depositados).</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  renderNavbar(container.querySelector('#navbar-container'), 'whitepaper');
  
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);
}
