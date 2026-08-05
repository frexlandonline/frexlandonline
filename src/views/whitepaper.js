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
            <li><a href="#juegos" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">3. Juegos (BlockDrop)</a></li>
            <li><a href="#finanzas" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">4. Finanzas y Retiros</a></li>
            <li><a href="#objetivos" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">5. Objetivos del Proyecto</a></li>
            <li><a href="#equipo" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">6. El Equipo</a></li>
            <li><a href="#seguridad" style="color: var(--text-secondary); text-decoration: none; font-weight: bold; transition: color 0.2s;">7. Seguridad y Contratos</a></li>
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
              <li style="margin-bottom: 10px;"><strong>Leaderboard:</strong> Tabla de posiciones global actualizada en tiempo real.</li>
              <li style="margin-bottom: 10px;"><strong>Billetera:</strong> Sección para gestionar tus depósitos de USDC y tus retiros.</li>
              <li style="margin-bottom: 10px;"><strong>Información de Créditos:</strong> En la parte derecha verás tu saldo de USDC y de Créditos disponibles.</li>
              <li style="margin-bottom: 10px;"><strong>Menú de Perfil (Avatar):</strong> Al hacer clic en tu inicial o imagen, despliegas un menú para ir a tu <em>Dashboard</em> (Perfil), acceder a este <em>Whitepaper</em>, o <em>Cerrar Sesión</em>.</li>
            </ul>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Conexión de Cuenta y Perfil</h3>
            <div style="width:100%; margin: 15px 0; text-align: center;">
              <img src="/assets/images/login.png" alt="Menú de Conexión" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            </div>
            <p>La plataforma ofrece múltiples vías de registro (Correo/Contraseña o Google). Una vez dentro de tu perfil, la seguridad de las cuentas es estricta: un medio de conexión no sobrescribe a otro y tu sesión está protegida mediante almacenamiento temporal. Al cerrar sesión o en caso de inactividad, se limpia tu información local por seguridad.</p>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Botones de Juego y Puntaje Pendiente</h3>
            <div style="width:100%; margin: 15px 0; text-align: center;">
              <img src="/assets/images/game.png" alt="Menú del Juego BlockDrop" style="max-width: 100%; max-height: 500px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            </div>
            <p>Dentro de BlockDrop verás el área de juego y, en caso de superar tu récord temporal, aparecerá la opción de <strong>Guardar Puntaje</strong> en la barra superior o en el panel de resumen de la partida.</p>
            <div style="background: rgba(255,0,0,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid var(--neon-pink); margin-bottom: 15px;">
              <h4 style="color: var(--neon-pink); margin-top: 0;">¡ATENCIÓN! Guardado Local</h4>
              <p style="margin-bottom: 0;">Es crucial entender que <strong>el puntaje pendiente NO se graba en la base de datos hasta que tú decidas gastar 1 crédito para guardarlo</strong>. Mientras tanto, tu puntaje máximo sin guardar permanece de manera <strong>local en el navegador de tu dispositivo actual</strong>.</p>
            </div>
            <p>Esto significa que <strong>si juegas en tu computadora y generas un gran puntaje, NO podrás abrir tu cuenta desde el celular para guardarlo allí.</strong> El puntaje pendiente vive estrictamente en la memoria de la ventana/navegador donde se jugó. Una vez guardado oficialmente con un crédito, ya es público, se inscribe en la blockchain y se asocia para siempre a tu usuario en la nube, y ahí el registro local se elimina para evitar duplicados.</p>
          </section>

          <section id="juegos" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">3. Juegos (BlockDrop)</h2>
            <p><strong>BlockDrop</strong> es el primer juego insignia de FrexLand. Inspirado en clásicos rompecabezas, los jugadores conectan su billetera, depositan USDC (en la red Base) para obtener créditos, y compiten por alcanzar el puntaje más alto. </p>
            <ul>
              <li style="margin-bottom: 10px;"><strong>Depósitos:</strong> 10 USDC = 1 Crédito para grabar puntaje.</li>
              <li style="margin-bottom: 10px;"><strong>Juego Libre:</strong> Puedes practicar todo lo que quieras sin gastar créditos.</li>
              <li style="margin-bottom: 10px;"><strong>Registro:</strong> Al usar 1 crédito, tu puntaje se inscribe en el ranking semanal.</li>
            </ul>
          </section>

          <section id="finanzas" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">4. Finanzas y Retiros</h2>
            <p>Todo el USDC depositado por los usuarios se envía de forma transparente a un pool de liquidez en Aave (Base Network), generando intereses constantemente.</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid var(--neon-cyan);">
              <h4 style="color: var(--neon-cyan); margin-top: 0;">Distribución del Interés Semanal</h4>
              <p style="margin-bottom: 0;">Cada jueves a las 00:00 UTC, los intereses generados se reparten:<br>
              • <strong>70%</strong> se divide entre el Top 3 (50%, 35%, 15%).<br>
              • <strong>30%</strong> va al equipo de desarrollo para el mantenimiento de la plataforma.</p>
            </div>
            <p><strong>Retiros Seguros:</strong> Tu depósito inicial siempre es tuyo. Puedes solicitar su retiro, el cual tiene un período de seguridad y confirmación de 24 horas para proteger el capital del pool contra ataques de manipulación.</p>
          </section>

          <section id="objetivos" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">5. Objetivos del Proyecto</h2>
            <p>A corto plazo, buscamos consolidar la comunidad de BlockDrop y probar la escalabilidad del sistema económico en la red Base.</p>
            <p>A mediano y largo plazo, FrexLand será el hub de múltiples juegos competitivos, torneos, NFTs cosméticos y asociaciones con otros protocolos DeFi, creando la primera economía de <em>Play-and-Earn</em> verdaderamente sostenible.</p>
          </section>

          <section id="equipo" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">6. El Equipo</h2>
            <p>Por ahora, el proyecto está siendo desarrollado íntegramente por un desarrollador independiente en conjunto con los potentes agentes de inteligencia artificial de <strong>Antigravity</strong> (Google DeepMind).</p>
            <p>Nuestra visión es construir la plataforma más transparente y divertida de la Web3. Si deseas formar parte del equipo, tienes talento y quieres sumar al proyecto, no dudes en visitar la sección de <strong><a href="#/contact" style="color: var(--neon-pink); text-decoration: none; font-weight: bold;">Contacto</a></strong>.</p>
          </section>

          <section id="seguridad" style="margin-bottom: 50px;">
            <h2 style="color: #fff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 20px;">7. Seguridad y Contratos (Auditoría)</h2>
            <p>La transparencia y seguridad de los fondos son el pilar más crítico de FrexLand. Nuestro contrato inteligente (Smart Contract) corre sobre la blockchain de <strong>Base</strong>.</p>
            <div style="background: rgba(0, 245, 255, 0.05); border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px; overflow-wrap: break-word;">
              <strong style="color: var(--neon-cyan);">Contrato Oficial (Base Network):</strong><br>
              <a href="https://basescan.org/address/0x8bb01A4e20638A58c168a9a6745d0F62231B0b94" target="_blank" style="color: #fff; text-decoration: underline; font-family: monospace; font-size: 1.1rem;">0x8bb01A4e20638A58c168a9a6745d0F62231B0b94</a>
            </div>

            <h3 style="color: var(--neon-cyan); margin-top: 30px;">Auditoría con Slither</h3>
            <p>El código del contrato ha sido analizado profundamente utilizando <strong>Slither</strong>, el framework de análisis estático más avanzado para Solidity. Durante el desarrollo y la auditoría, se implementaron las siguientes protecciones de estándar industrial:</p>
            <ul>
              <li style="margin-bottom: 10px;"><strong>Protección contra Reentrancy:</strong> Utilizamos <code>ReentrancyGuard</code> de OpenZeppelin en todas las funciones sensibles (especialmente el retiro de fondos) para prevenir ataques donde un contrato malicioso intente drenar liquidez llamando recursivamente a la función.</li>
              <li style="margin-bottom: 10px;"><strong>Patrón "Pull over Push":</strong> En lugar de que el contrato envíe fondos automáticamente a los ganadores (lo cual es riesgoso y puede causar bloqueos si una transferencia falla), el protocolo requiere que los usuarios soliciten su retiro. Esto aísla el riesgo de fallo de un usuario del resto del ecosistema.</li>
              <li style="margin-bottom: 10px;"><strong>Time-Lock de 24 Horas:</strong> Implementamos un mecanismo de seguridad estricto que obliga a esperar 24 horas tras solicitar un retiro. Esto neutraliza manipulaciones de precios flash-loan y da tiempo a reaccionar en caso de un evento inesperado.</li>
              <li style="margin-bottom: 10px;"><strong>Interacción Segura con Aave V3:</strong> El contrato no reinventa la rueda financiera; deposita los USDC directamente en Aave V3 utilizando integraciones estándar y comprobadas, limitando el riesgo sistémico únicamente a la seguridad ampliamente validada de Aave.</li>
              <li style="margin-bottom: 10px;"><strong>Sin "Owner Trap":</strong> El propietario del contrato no tiene capacidad de pausar los retiros legítimos de los usuarios ni de acceder a sus depósitos, garantizando la confianza y descentralización de los fondos.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  `;

  renderNavbar(container.querySelector('#navbar-container'), 'whitepaper');
  
  // Attach footer
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);
}
