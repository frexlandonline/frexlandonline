import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import api from '../services/api.js';
import { showToast } from '../main.js';

export function renderContactPage(container) {
  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh;">
      <div class="card-glass" style="max-width: 900px; width: 90%; margin: 60px 20px; padding: 60px; text-align: left; position: relative; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;">
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 20px; text-align: center;">Contacto</h2>
        <p style="color: var(--text-secondary); text-align: justify; margin-bottom: 40px; font-size: 1.1rem; line-height: 1.8; width: 100%;">
          ¿Tienes alguna duda, sugerencia o encontraste un error? Escríbenos y nos pondremos en contacto contigo lo antes posible.
        </p>

        <form id="contact-form" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <!-- Honeypot field (hidden from real users, bots will fill it) -->
          <div style="display: none;">
            <label for="honeypot">No llenar este campo si eres humano:</label>
            <input type="text" id="honeypot" name="honeypot" tabindex="-1" autocomplete="off">
          </div>

          <div class="form-group">
            <label style="color: var(--neon-cyan); font-weight: bold; margin-bottom: 5px; display: block;">Tu Correo Electrónico</label>
            <input type="email" id="contact-email" class="form-control" placeholder="tu@email.com" required style="width: 100%; padding: 12px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); color: #fff; border-radius: 8px;">
          </div>

          <div class="form-group">
            <label style="color: var(--neon-cyan); font-weight: bold; margin-bottom: 5px; display: block;">Mensaje</label>
            <textarea id="contact-message" class="form-control" rows="5" placeholder="Escribe tu mensaje aquí..." required style="width: 100%; padding: 12px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); color: #fff; border-radius: 8px; resize: vertical;"></textarea>
          </div>

          <!-- Math Challenge -->
          <div class="form-group">
            <label id="contact-math-label" style="color: var(--neon-pink); font-weight: bold; margin-bottom: 5px; display: block;">Pregunta de Seguridad: Cargando...</label>
            <input type="number" id="contact-math" class="form-control" placeholder="Respuesta" required style="width: 100%; padding: 12px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,51,102,0.4); color: #fff; border-radius: 8px;">
          </div>

          <button type="submit" class="btn btn-primary" id="btn-submit-contact" style="margin-top: 10px; width: 100%; padding: 14px; font-size: 1.1rem; box-shadow: var(--shadow-glow-cyan);">
            Enviar Mensaje
          </button>
        </form>
      </div>
    </div>
  `;

  renderNavbar(container.querySelector('#navbar-container'), 'contact');
  
  // Attach footer
  const pageContainer = container.querySelector('.home-page');
  const footerDiv = document.createElement('div');
  footerDiv.style.marginTop = 'auto';
  footerDiv.style.width = '100%';
  pageContainer.appendChild(footerDiv);
  renderFooter(footerDiv);

  let currentChallengeId = null;

  async function loadChallenge() {
    try {
      const res = await api.get('/contact/challenge');
      currentChallengeId = res.challengeId;
      document.getElementById('contact-math-label').textContent = 'Pregunta de Seguridad: ' + res.text;
      document.getElementById('contact-math').value = '';
    } catch (err) {
      console.error('Failed to load challenge:', err);
      document.getElementById('contact-math-label').textContent = 'Pregunta de Seguridad: ¿Cuánto es 7 + 4?';
    }
  }

  // Load the first challenge
  loadChallenge();

  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const math_answer = document.getElementById('contact-math').value;
    const honeypot = document.getElementById('honeypot').value;
    const btn = document.getElementById('btn-submit-contact');

    try {
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const res = await api.post('/contact', { email, message, math_answer, challengeId: currentChallengeId, honeypot });
      showToast(res.message, 'success');
      
      // Reset form
      document.getElementById('contact-form').reset();
      // Load new challenge
      loadChallenge();
    } catch (err) {
      showToast(err.message || 'Error al enviar el mensaje.', 'error');
      // Reload challenge on failure
      loadChallenge();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar Mensaje';
    }
  });
}
