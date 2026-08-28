import { t, getLang, setLang } from '../utils/i18n.js';

export function renderLandingPage(container) {
  // Configurar el tema
  document.body.classList.add('frexland-theme');

  const lang = getLang();

  container.innerHTML = `
    <div class="landing-page">
      
      <!-- LANG SELECTOR -->
      <div style="position: absolute; top: 20px; right: 20px; z-index: 100; display: flex; gap: 5px; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 8px; border: 1px solid var(--neon-cyan);">
        <button class="landing-lang-btn ${lang === 'es' ? 'active' : ''}" data-lang="es" style="background: ${lang === 'es' ? 'var(--neon-cyan)' : 'transparent'}; color: ${lang === 'es' ? '#000' : '#fff'}; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: bold;">ES</button>
        <button class="landing-lang-btn ${lang === 'en' ? 'active' : ''}" data-lang="en" style="background: ${lang === 'en' ? 'var(--neon-cyan)' : 'transparent'}; color: ${lang === 'en' ? '#000' : '#fff'}; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: bold;">EN</button>
      </div>

      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="hero-background-grid"></div>
        <div class="hero-content">
          <div class="hero-logo font-retro">🕹️ FREXLAND</div>
          <h1 class="hero-title">
            ${t('heroTitle')}
          </h1>
          <p class="hero-subtitle">
            ${t('heroSubtitle')}
          </p>
          <a href="#/auth" class="hero-cta">${t('btnPlayNow')}</a>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="how-it-works">
        <h2 class="section-title font-retro text-gradient">${t('howItWorks')}</h2>
        <div class="steps-grid">
          
          <div class="step-card">
            <div class="step-icon">🔗</div>
            <h3 class="step-title">${t('step1Title')}</h3>
            <p class="step-desc">
              ${t('step1Desc')}
            </p>
          </div>

          <div class="step-card">
            <div class="step-icon">💰</div>
            <h3 class="step-title">${t('step2Title')}</h3>
            <p class="step-desc">
              ${t('step2Desc')}
            </p>
          </div>

          <div class="step-card">
            <div class="step-icon">🏆</div>
            <h3 class="step-title">${t('step3Title')}</h3>
            <p class="step-desc">
              ${t('step3Desc')}
            </p>
          </div>

        </div>
      </section>

      <!-- STATS / TRUST -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">${t('statsOnChain')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number font-retro">WEB3</span>
            <span class="stat-label">${t('statsTech')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">${t('statsTournaments')}</span>
          </div>
        </div>
      </section>

      <!-- PARTNERS -->
      <section class="partners-section">
        <h4 class="partners-title">${t('partnersTitle')}</h4>
        <div class="partners-logos">
          <div class="partner-logo">👁️ Worldcoin</div>
          <div class="partner-logo">🍋 Lemon Cash</div>
          <div class="partner-logo">🔵 Base Network</div>
          <div class="partner-logo">🦊 MetaMask</div>
          <div class="partner-logo">👻 Aave</div>
        </div>
      </section>

      <!-- FOOTER CTA -->
      <section class="footer-cta">
        <h2 class="footer-cta-title font-retro text-gradient">${t('footerTitle')}</h2>
        <p class="footer-cta-desc">
          ${t('footerDesc')}
        </p>
        <a href="#/auth" class="hero-cta">${t('btnJoin')}</a>
        
        <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 15px;">
          <p style="color: var(--neon-cyan); font-family: 'Press Start 2P', cursive; font-size: 0.7rem; text-shadow: 1px 1px 2px #000;">${t('socialJoin')}</p>
          <div style="display: flex; gap: 25px; align-items: center;">
            <a href="https://x.com/FrexLandOnline" target="_blank" rel="noopener noreferrer" style="color: #fff; transition: transform 0.2s, color 0.2s;" onmouseover="this.style.transform='scale(1.25)'; this.style.color='var(--neon-cyan)';" onmouseout="this.style.transform='scale(1)'; this.style.color='#fff';" title="X (Twitter)">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="display: block;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://discord.gg/VbTyqgqrS" target="_blank" rel="noopener noreferrer" style="color: #fff; transition: transform 0.2s, color 0.2s;" onmouseover="this.style.transform='scale(1.25)'; this.style.color='#5865F2';" onmouseout="this.style.transform='scale(1)'; this.style.color='#fff';" title="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 127.14 96.36" fill="currentColor" style="display: block;"><path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,71.43,71.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2.06a75.48,75.48,0,0,0,73.1,0c.81.72,1.68,1.41,2.58,2.06a71.43,71.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,0,0,0,31.58-18.83C129,54.65,122.56,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/></svg>
            </a>
            <a href="https://www.instagram.com/frexland.online/" target="_blank" rel="noopener noreferrer" style="color: #fff; transition: transform 0.2s, color 0.2s;" onmouseover="this.style.transform='scale(1.25)'; this.style.color='#E1306C';" onmouseout="this.style.transform='scale(1)'; this.style.color='#fff';" title="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        <div class="footer-links">
          <a href="https://frexland-online.gitbook.io/frexland-online-docs/" target="_blank" rel="noopener noreferrer" class="footer-link">${t('linkWhitepaper')}</a>
          <a href="#/faq" class="footer-link">${t('linkFAQ')}</a>
          <a href="#/contact" class="footer-link">${t('linkContact')}</a>
        </div>
      </section>

    </div>
  `;

  // Bind language buttons
  container.querySelectorAll('.landing-lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newLang = btn.getAttribute('data-lang');
      setLang(newLang);
    });
  });
}
