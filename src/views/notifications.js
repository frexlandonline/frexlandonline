import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderNotificationsPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh;">
      <div class="card-glass" style="max-width: 900px; width: 90%; margin: 60px 20px; padding: 60px; text-align: left; position: relative; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 4rem; margin-bottom: 30px; animation: float 3s ease-in-out infinite;">🔔</div>
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 20px;">Notificaciones</h2>
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px; margin-top: 30px; width: 100%; box-sizing: border-box;">
          <h3 style="color: var(--neon-cyan); margin-bottom: 20px; font-size: 1.5rem;">Próximamente...</h3>
          <p style="color: var(--text-secondary); line-height: 1.8; font-size: 1.1rem; margin: 0; width: 100%; text-align: justify;">
            Aquí vamos a publicar los futuros cambios, actualizaciones, eventos y modificaciones del proyecto. ¡Mantente atento para no perderte ninguna novedad de BlockDrop!
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
