import { t } from '../utils/i18n.js';
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
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 40px; text-align: center;">${t('faqTitle')}</h2>

        <div style="display: flex; flex-direction: column; width: 100%;">
          
          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">${t('faq1Q')}</summary>
            <div class="faq-content">
              ${t('faq1A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">${t('faq2Q')}</summary>
            <div class="faq-content">
              ${t('faq2A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">${t('faq3Q')}</summary>
            <div class="faq-content">
              <p style="margin-top: 0;">${t('faq3A1')}</p>
              <p>${t('faq3A2')}</p>
              <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-AR&ref=GRO_28502_IWZRB&utm_source=referral_entrance" target="_blank" class="btn btn-primary btn-sm" style="display: inline-block; text-decoration: none; margin-bottom: 20px;">${t('faq3Link')}</a>
              <div style="background: #000; border-radius: 8px; padding: 20px; text-align: center; border: 1px dashed var(--border-color);">
                <p style="color: #666; margin: 0;">${t('faq3Vid')}</p>
                <!-- <iframe width="100%" height="315" src="https://www.youtube.com/embed/TU_ID_DE_VIDEO" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> -->
              </div>
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">${t('faq4Q')}</summary>
            <div class="faq-content">
              ${t('faq4A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">${t('faq5Q')}</summary>
            <div class="faq-content">
              ${t('faq5A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">${t('faq6Q')}</summary>
            <div class="faq-content">
              ${t('faq6A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">${t('faq7Q')}</summary>
            <div class="faq-content">
              ${t('faq7A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-cyan);">
            <summary class="faq-summary" style="color: var(--neon-cyan);">${t('faq8Q')}</summary>
            <div class="faq-content">
              ${t('faq8A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-pink);">
            <summary class="faq-summary" style="color: var(--neon-pink);">${t('faq9Q')}</summary>
            <div class="faq-content">
              ${t('faq9A')}
            </div>
          </details>

          <details class="faq-details" style="border-left: 4px solid var(--neon-purple);">
            <summary class="faq-summary" style="color: var(--neon-purple);">${t('faq10Q')}</summary>
            <div class="faq-content">
              ${t('faq10A')}
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


