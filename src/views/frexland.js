import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderFrexlandPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page frexland-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-bottom: var(--space-2xl); background: radial-gradient(circle at top, #2a0845 0%, #000000 100%); min-height: 100vh;">
      <div class="frexland-content" style="max-width: 1000px; width: 100%; display: flex; flex-direction: column; gap: var(--space-2xl); align-items: center; padding: var(--space-lg); padding-top: 40px;">
        
        <!-- Header Retro (Estilo Distinto a Blockdrop) -->
        <div class="frexland-header" style="text-align: center;">
          <h1 class="frexland-title retro-text" style="font-size: 3rem; color: #ff8c00; text-shadow: 4px 4px 0 #9400d3, 8px 8px 0 #39ff14; margin-bottom: 10px; font-family: 'Press Start 2P', cursive;">FrexLand</h1>
          <p class="frexland-subtitle retro-text" style="font-size: 1rem; color: #39ff14; margin-top: 15px; font-family: 'Press Start 2P', cursive; text-shadow: 1px 1px 2px #000;">El Arcade del Futuro</p>
        </div>

        <!-- Grid de Juegos (Ahora Primero) -->
        <div style="width: 100%;">
          <h3 class="retro-text" style="font-size: 1.2rem; text-align: center; margin-bottom: var(--space-md); color: #fff; font-family: 'Press Start 2P', cursive; text-shadow: 2px 2px #9400d3;">SELECCIONA UN JUEGO</h3>
          <div class="games-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; width: 100%;">
            
            <!-- BlockDrop -->
            <div class="game-card active-game" onclick="localStorage.setItem('last_played_game', '#/play'); window.location.hash='#/blockdrop'" style="cursor: pointer; position: relative; overflow: hidden; border: 4px solid #ff8c00; transition: transform 0.3s; background: rgba(0,0,0,0.8); box-shadow: 0 0 15px rgba(255,140,0,0.5);">
              <div style="height: 160px; background: linear-gradient(135deg, rgba(233,30,99,0.3) 0%, rgba(10,10,26,1) 100%); display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 4px solid #ff8c00;">
                <div style="display: grid; grid-template-columns: repeat(3, 20px); gap: 2px;">
                  <div style="width: 20px; height: 20px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff;"></div>
                  <div style="width: 20px; height: 20px; background: #e91e63; box-shadow: 0 0 10px #e91e63;"></div>
                  <div style="width: 20px; height: 20px; background: #ffeb3b; box-shadow: 0 0 10px #ffeb3b;"></div>
                  <div style="width: 20px; height: 20px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff;"></div>
                </div>
              </div>
              <div style="padding: 20px; text-align: center;">
                <h4 style="font-family: 'Press Start 2P', cursive; font-size: 1.1rem; color: #ff8c00; margin-bottom: 15px;">BlockDrop</h4>
                <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 20px; font-family: monospace;">El clásico de bloques cayendo, re-imaginado con recompensas cripto.</p>
                <button class="btn" style="background: #9400d3; color: #39ff14; width: 100%; font-weight: bold; border-radius: 0; font-family: 'Press Start 2P', cursive; font-size: 0.7rem; padding: 15px; border: 2px solid #39ff14;">JUGAR AHORA</button>
              </div>
            </div>

            <!-- Snake (Próximamente) -->
            <div class="game-card disabled-game" style="position: relative; overflow: hidden; border: 4px solid #555; background: rgba(0,0,0,0.8); opacity: 0.7;">
              <div style="height: 160px; background: #222; display: flex; align-items: center; justify-content: center; border-bottom: 4px solid #555;">
                <div style="font-size: 3rem; filter: grayscale(1);">🐍</div>
              </div>
              <div style="padding: 20px; text-align: center;">
                <h4 style="font-family: 'Press Start 2P', cursive; font-size: 1rem; color: #888; margin-bottom: 15px;">Crypto Snake</h4>
                <p style="font-size: 0.9rem; color: #777; margin-bottom: 20px; font-family: monospace;">Crece comiendo tokens. ¡No choques!</p>
                <button class="btn" style="background: #333; color: #888; width: 100%; cursor: not-allowed; border-radius: 0; font-family: 'Press Start 2P', cursive; font-size: 0.6rem; padding: 15px; border: 2px solid #555;">PRÓXIMAMENTE</button>
              </div>
            </div>

          </div>
        </div>

        <!-- Tabla de Popularidad (Fondo Común Global) -->
        <div class="card card-glass global-pool-section" style="width: 100%; border: 4px solid #9400d3; box-shadow: 0 0 20px rgba(148,0,211,0.4); position: relative; overflow: hidden; background: rgba(0,0,0,0.85); margin-top: 10px;">
          <div style="text-align: center; margin-bottom: var(--space-lg);">
            <h2 class="retro-text" style="font-size: 1.2rem; color: #ff8c00; margin-bottom: 15px; font-family: 'Press Start 2P', cursive;">DISTRIBUCIÓN DE PREMIOS</h2>
            <p style="color: #aaa; font-size: 0.9rem;">Los premios globales se reparten proporcionalmente a la cantidad de créditos utilizados en cada juego para registrar puntajes.</p>
          </div>

          <!-- Distribución Mockup -->
          <div style="width: 100%; padding: 0 20px;">
            <div style="font-size: 0.85rem; color: #fff; margin-bottom: 8px; display: flex; justify-content: space-between; font-family: 'Press Start 2P', cursive; font-size: 0.7rem;">
              <span>BlockDrop</span>
              <span style="color: #39ff14;">100%</span>
            </div>
            <div style="width: 100%; height: 16px; background: #000; border: 2px solid #fff; margin-bottom: 25px;">
              <div style="width: 100%; height: 100%; background: #39ff14; box-shadow: 0 0 10px #39ff14;"></div>
            </div>

            <div style="font-size: 0.85rem; color: #fff; margin-bottom: 8px; display: flex; justify-content: space-between; font-family: 'Press Start 2P', cursive; font-size: 0.7rem;">
              <span>Crypto Snake</span>
              <span style="color: #555;">0%</span>
            </div>
            <div style="width: 100%; height: 16px; background: #000; border: 2px solid #555;">
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
