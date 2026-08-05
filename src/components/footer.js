import { showTermsOnlyModal } from './termsModal.js';

export function renderFooter(container) {
  // Check if footer already exists in the container to avoid duplicates
  if (container.querySelector('.footer-section')) return;

  const footer = document.createElement('footer');
  footer.className = 'footer-section';
  footer.style.cssText = `
    width: 100%;
    text-align: center;
    padding: var(--space-lg) var(--space-md);
    margin-top: var(--space-2xl);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(5, 5, 15, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
  `;
  
  footer.innerHTML = `
    <div>
      FrexLand © 2026 🎮 El Arcade Web3 Multiplataforma con recompensas DeFi
    </div>
    <div style="display: flex; gap: 15px; margin-top: 15px; margin-bottom: 5px; flex-wrap: wrap; justify-content: center;">
      <a href="https://www.instagram.com/frexland.online/" target="_blank" style="color: #fff; text-decoration: none; font-family: 'Press Start 2P', cursive; font-size: 0.55rem; border: 2px solid #ff00ff; padding: 8px 10px; transition: all 0.2s; background: rgba(255,0,255,0.1); text-transform: uppercase;" onmouseover="this.style.background='#ff00ff'; this.style.color='#000';" onmouseout="this.style.background='rgba(255,0,255,0.1)'; this.style.color='#fff';">📷 INSTAGRAM</a>
      <a href="https://x.com/FrexLandOnline" target="_blank" style="color: #fff; text-decoration: none; font-family: 'Press Start 2P', cursive; font-size: 0.55rem; border: 2px solid #00ffff; padding: 8px 10px; transition: all 0.2s; background: rgba(0,255,255,0.1); text-transform: uppercase;" onmouseover="this.style.background='#00ffff'; this.style.color='#000';" onmouseout="this.style.background='rgba(0,255,255,0.1)'; this.style.color='#fff';">🐦 X (TWITTER)</a>
      <a href="https://discord.gg/VbTyqgqrS" target="_blank" style="color: #fff; text-decoration: none; font-family: 'Press Start 2P', cursive; font-size: 0.55rem; border: 2px solid #39ff14; padding: 8px 10px; transition: all 0.2s; background: rgba(57,255,20,0.1); text-transform: uppercase;" onmouseover="this.style.background='#39ff14'; this.style.color='#000';" onmouseout="this.style.background='rgba(57,255,20,0.1)'; this.style.color='#fff';">💬 DISCORD</a>
    </div>
    <div style="margin-top: 10px;">
      🎧 Música por <a href="https://open.spotify.com/intl-es/artist/6aLrzuqJKxnbfmDIxSzcDb?si=nF7QpgRrQUaWxQUNLCYRmA" target="_blank" style="color: #1DB954; text-decoration: none; font-weight: bold;">EdgarAllanMusic</a>
    </div>
    <div style="display: flex; gap: var(--space-md); margin-top: 10px;">
      <span id="footer-link-terms" style="color: var(--neon-cyan); cursor: pointer; text-decoration: none; transition: color 0.2s ease;">📜 Términos de Servicio y Política de Privacidad</span>
    </div>
  `;
  
  container.appendChild(footer);
  
  const link = footer.querySelector('#footer-link-terms');
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showTermsOnlyModal();
    });
    link.addEventListener('mouseenter', () => {
      link.style.color = '#fff';
    });
    link.addEventListener('mouseleave', () => {
      link.style.color = 'var(--neon-cyan)';
    });
  }
}
