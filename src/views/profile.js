import { t } from '../utils/i18n.js';
import { getUser, logout, updateLocalUser } from '../services/auth.js';
import { wrapWithBadge } from '../components/avatarBadge.js';
import { renderNavbar } from '../components/navbar.js';
import { showToast } from '../main.js';
import api from '../services/api.js';
import { renderFooter } from '../components/footer.js';
import { getAaveFinancialData, withdrawUSDC } from '../web3/contract.ts';
import { parseUnits } from 'viem';
import { isWorldAppWebView } from '../web3/world.ts';
import { isLemonWebView } from '../web3/lemon.js';
import { getUserLevel, renderLevelBadge, LEVELS } from '../utils/levels.js';

export function renderProfilePage(container) {
  const user = getUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  const userLevel = getUserLevel(user.total_depositado || 0);

  // Predefined avatar seeds for Dicebear Bottts
  const avatarSeeds = ['CyberBot', 'NeonPlayer', 'ByteGamer', 'GridRunner', 'CryptoNerd'];
  let selectedAvatar = user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'Player'}`;

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 120px var(--space-md) var(--space-xl);">
      <div class="card card-glass" style="width: 100%; max-width: 520px; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); position: relative; overflow: hidden;">
        
        <div style="text-align: center; margin-bottom: var(--space-xl);">
          <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 1px; text-shadow: 0 0 10px rgba(139, 92, 246, 0.4);">
            ⚙️ ${t('profTitle')}
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
            ${t('profDesc')}
          </p>
        </div>

        <form id="profile-form" style="display: flex; flex-direction: column; gap: var(--space-lg);">
          
          <!-- Avatar Preview and Chooser -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; padding-bottom: var(--space-md); border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <div class="profile-avatar-wrapper">
                ${wrapWithBadge(`<img id="avatar-preview-img" src="${selectedAvatar}" style="width: 96px; height: 96px; border-radius: 50%; border: 2px solid #000; background: var(--bg-secondary); object-fit: cover; box-sizing: border-box;">`, isWorldAppWebView() ? 'worldchain' : (isLemonWebView() ? 'lemon' : 'html5'))}
              </div>
              
              <div class="profile-platform-pill">
                ${isWorldAppWebView() ? `
                  <img src="/assets/icons/wld.png" alt="World App">
                  <span style="font-weight: 600; color: var(--neon-cyan);">World App (World Chain)</span>
                ` : (isLemonWebView() || user.platform === 'lemon') ? `
                  <span>🍋</span>
                  <span style="font-weight: 600; color: #00C853;">Lemon Cash</span>
                ` : `
                  <img src="/assets/icons/html5.png" alt="HTML5">
                  <span style="font-weight: 600; color: #E34F26;">Web / HTML5</span>
                `}
              </div>
            </div>
            
            <div style="text-align: center; width: 100%;">
              <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                ${t('profChooseAvatar')}
              </label>
              
              <!-- Avatar Seed List -->
              <div style="display: flex; justify-content: center; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
                ${avatarSeeds.map(seed => {
                  const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                  const isCurrent = selectedAvatar === url || selectedAvatar.includes(`seed=${seed}`);
                  return `
                    <div class="avatar-option ${isCurrent ? 'selected' : ''}" 
                         data-url="${url}" 
                         style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${isCurrent ? 'var(--neon-cyan)' : 'var(--border-color)'}; cursor: pointer; transition: all 0.2s ease; padding: 2px; background: rgba(0,0,0,0.3);"
                         title="Avatar ${seed}">
                      <img src="${url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                    </div>
                  `;
                }).join('')}

                ${user.googleAvatarUrl ? `
                  <div class="avatar-option ${selectedAvatar === user.googleAvatarUrl ? 'selected' : ''}" 
                       data-url="${user.googleAvatarUrl}" 
                       style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${selectedAvatar === user.googleAvatarUrl ? 'var(--neon-cyan)' : 'var(--border-color)'}; cursor: pointer; transition: all 0.2s ease; padding: 2px; background: rgba(0,0,0,0.3);"
                       title="Foto de Google">
                    <img src="${user.googleAvatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                  </div>
                ` : ''}
              </div>

              <!-- Custom image upload option -->
              <div style="margin-top: var(--space-md); width: 100%; max-width: 280px; display: inline-flex; flex-direction: column; align-items: center; gap: 8px;">
                <label for="avatar-upload" class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center; font-size: 0.8rem; padding: 6px;">
                  ${t('profUploadAvatar')}
                </label>
                <input type="file" id="avatar-upload" accept="image/jpeg, image/png, image/webp" style="display: none;">
              </div>
            </div>
          </div>

          <!-- PLAYER LEVEL & TIER CARD -->
          <div class="card card-level" style="background: radial-gradient(circle at top, rgba(255,255,255,0.04) 0%, rgba(10,10,26,0.9) 100%); border: 1.5px solid ${userLevel.borderColor}; box-shadow: ${userLevel.shadow}; border-radius: var(--radius-md); padding: 18px 16px; margin-bottom: 4px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; display: block;">NIVEL DE JUGADOR</span>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                  <span style="font-size: 1.6rem; line-height: 1;">${userLevel.icon}</span>
                  <span style="font-family: var(--font-display); font-size: 1.25rem; font-weight: bold; color: ${userLevel.color}; letter-spacing: 0.05em;">
                    ${userLevel.name}
                  </span>
                </div>
              </div>
              
              <div style="text-align: right;">
                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block;">Depósito en Aave</span>
                <span style="font-family: var(--font-display); font-size: 1.05rem; font-weight: bold; color: var(--neon-cyan);">
                  ${(user.total_depositado || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </span>
              </div>
            </div>

            <!-- Progress Bar to Next Level -->
            <div style="margin-top: 8px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 5px;">
                <span>${userLevel.isMax ? '🏆 Rango Máximo Legendario' : `Progreso a Nivel ${userLevel.nextLevel?.name || ''}`}</span>
                <span style="font-weight: bold; color: ${userLevel.color};">${userLevel.progress}%</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                <div style="width: ${userLevel.progress}%; height: 100%; background: ${userLevel.bgGradient || 'var(--gradient-primary)'}; border-radius: 6px; transition: width 0.4s ease;"></div>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 5px; text-align: right;">
                ${userLevel.isMax 
                  ? '¡Has alcanzado la cima del ecosistema FrexLand!' 
                  : `Faltan <strong style="color: var(--neon-cyan);">${userLevel.toNext} USDC</strong> para alcanzar Nivel ${userLevel.nextLevel?.name}`}
              </div>
            </div>

            <!-- Tiers Guide (Collapsible details) -->
            <details style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px; font-size: 0.76rem; cursor: pointer;">
              <summary style="font-weight: 600; color: var(--text-secondary); outline: none; list-style: none; display: flex; justify-content: space-between; align-items: center;">
                <span>ℹ️ Ver Escala de Niveles, Premios y Beneficios</span>
                <span style="color: var(--neon-cyan); font-size: 0.7rem;">Desplegar ▼</span>
              </summary>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; color: var(--text-secondary);">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>🌱 <strong>Sin Rango:</strong> &lt; 1 USDC</span> <span style="color: var(--text-muted);">0 créd/sem • Tabla Global</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>🌳 <strong>Madera:</strong> 1 a 9.99 USDC</span> <span style="color: #d97706;">1 créd/sem • Premio prop. (10%/USDC)</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>🥉 <strong>Bronce:</strong> 10 a 49.99 USDC</span> <span style="color: var(--neon-green);">1 a 4 créd/sem • 100% Premio + Cód. Ref</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>🥈 <strong>Plata:</strong> 50 a 99.99 USDC</span> <span style="color: var(--neon-green);">5 a 9 créd/sem • +1% Ref L1</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>🥇 <strong>Oro:</strong> 100 a 499.99 USDC</span> <span style="color: var(--neon-green);">10 a 49 créd/sem • +3% L1 + Transf. Créd</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>💠 <strong>Platino:</strong> 500 a 999.99 USDC</span> <span style="color: var(--neon-green);">50 a 99 créd/sem • +5% L1 / +1% L2</span></div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;"><span>💎 <strong>Diamante:</strong> 1000+ USDC</span> <span style="color: var(--neon-green);">100+ créd/sem • +5% L1 / +3% L2</span></div>
              </div>
            </details>
          </div>

          <!-- REFERRAL & CREDIT TRANSFER SECTION -->
          <div id="referral-system-card" style="background: rgba(139, 92, 246, 0.06); border: 1.5px solid rgba(139, 92, 246, 0.35); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <h3 style="font-family: var(--font-display); font-size: 0.95rem; color: var(--neon-cyan); margin: 0;">
                🤝 Sistema de Referidos y Créditos
              </h3>
              <span style="font-size: 0.72rem; background: rgba(0, 245, 255, 0.12); border: 1px solid rgba(0, 245, 255, 0.3); color: var(--neon-cyan); padding: 2px 8px; border-radius: 12px; font-weight: 700;">
                ${userLevel.referralL1 > 0
                  ? `Comisión Activa: ${(userLevel.referralL1 * 100).toFixed(0)}% L1${userLevel.referralL2 > 0 ? ` + ${(userLevel.referralL2 * 100).toFixed(0)}% L2` : ''}`
                  : (userLevel.canRefer ? 'Código Activo (Sube a Plata para % comisión)' : 'Requiere Bronce (≥10 USDC)')}
              </span>
            </div>

            <!-- 1. Personal Referral Code (Bronce+) -->
            <div id="referral-my-code-box" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px;">
              <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 6px;">
                🔗 Tu Código de Invitación Personal
              </div>
              <div id="referral-code-content" style="font-size: 0.82rem; color: var(--text-muted);">
                Cargando datos de referidos...
              </div>
            </div>

            <!-- 2. Apply Referrer Code (if not referred yet) -->
            <div id="referral-apply-box" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; display: none;">
              <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 6px;">
                🎟️ ¿Te invitó un jugador Bronce o superior?
              </div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="input-apply-ref-code" class="input-field" placeholder="Ej: FREX-AB12CD" style="flex: 1; font-size: 0.82rem; padding: 8px 10px; text-transform: uppercase;">
                <button type="button" id="btn-apply-ref-code" class="btn btn-secondary btn-sm" style="white-space: nowrap; border-color: var(--neon-cyan); color: var(--neon-cyan);">
                  Vincular
                </button>
              </div>
            </div>

            <!-- 3. Referral Network Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
              <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 4px;">
                <div style="font-size: 0.68rem; color: var(--text-muted);">Directos (N1)</div>
                <div id="ref-stat-l1" style="font-family: var(--font-display); font-size: 1rem; color: #fff; font-weight: bold; margin-top: 2px;">0</div>
              </div>
              <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 4px;">
                <div style="font-size: 0.68rem; color: var(--text-muted);">De Referidos (N2)</div>
                <div id="ref-stat-l2" style="font-family: var(--font-display); font-size: 1rem; color: var(--neon-purple); font-weight: bold; margin-top: 2px;">0</div>
              </div>
              <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 4px;">
                <div style="font-size: 0.68rem; color: var(--text-muted);">Ganancia Ref.</div>
                <div id="ref-stat-earnings" style="font-family: var(--font-display); font-size: 0.9rem; color: var(--neon-green); font-weight: bold; margin-top: 2px;">0.00 USDC</div>
              </div>
            </div>

            <!-- 4. Transfer Credits to Direct Referrals (Oro+) -->
            <div id="referral-transfer-box" style="background: rgba(234, 179, 8, 0.06); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.76rem; color: #facc15; font-weight: 700;">🎁 Transferir Créditos a Referidos (Rango Oro+)</span>
                <span id="profile-my-credits-pill" style="font-size: 0.72rem; color: var(--neon-green); font-weight: bold;">
                  Disponibles: ${user.creditos_escritura || 0} créd.
                </span>
              </div>
              <div id="referral-transfer-content" style="font-size: 0.8rem; color: var(--text-secondary);">
                Cargando...
              </div>
            </div>
          </div>

          <!-- Email (Read Only) -->
          <div class="input-group">
            <label>${t('profEmailLabel')}</label>
            <input type="email" value="${user.email || 'Conectado con Wallet'}" class="input-field" disabled style="opacity: 0.6; cursor: not-allowed; background: rgba(0,0,0,0.2);">
          </div>

          <!-- Username -->
          <div class="input-group">
            <label for="profile-username">${t('profUserLabel')}</label>
            <input type="text" id="profile-username" class="input-field" value="${user.username || ''}" required minlength="2" placeholder="${t('authUsernamePlaceholder')}" autocomplete="username">
          </div>

          <!-- Twitter / X -->
          <div class="input-group">
            <label for="profile-twitter">Twitter / X</label>
            <input type="text" id="profile-twitter" class="input-field" value="${user.twitter || ''}" placeholder="Ej: @TuUsuario">
          </div>

          <!-- Discord -->
          <div class="input-group">
            <label for="profile-discord">Discord</label>
            <input type="text" id="profile-discord" class="input-field" value="${user.discord || ''}" placeholder="Ej: usuario#0000 o usuario">
          </div>

          <!-- Telegram -->
          <div class="input-group">
            <label for="profile-telegram">Telegram</label>
            <input type="text" id="profile-telegram" class="input-field" value="${user.telegram || ''}" placeholder="Ej: @TuUsuario">
          </div>

          <!-- World ID Status (Solo visible en World App Mini App) -->
          ${isWorldAppWebView() ? `
          <div class="input-group" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.25); padding: var(--space-md); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--neon-cyan); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
                🌍 Verificación de Humanidad (World ID)
              </span>
              ${user.isWorldIdVerified ? `
                <span style="font-size: 0.75rem; background: rgba(57, 255, 20, 0.1); border: 1px solid var(--neon-green); color: var(--neon-green); padding: 2px 8px; border-radius: 20px; font-weight: bold;">
                  ✅ Verificado
                </span>
              ` : `
                <span style="font-size: 0.75rem; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.4); color: #FFA500; padding: 2px 8px; border-radius: 20px; font-weight: bold;">
                  Pendiente
                </span>
              `}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
              ${user.isWorldIdVerified ? `
                🎉 Tu cuenta está verificada como humano real. Recibes <strong>+1 crédito de juego extra semanal</strong> que se renueva automáticamente tras cada entrega de premios con la cuenta regresiva.
              ` : `
                🛡️ Al verificar tu humanidad con World ID Orb en la sección <a href="#/wallet" style="color: var(--neon-cyan); font-weight: 600;">Billetera</a>, obtienes <strong>+1 crédito extra semanal</strong> renovable tras cada entrega de premios con la cuenta regresiva.
              `}
            </div>
          </div>
          ` : ''}

          <!-- Wallets count / details -->
          <div class="input-group" style="background: rgba(0,0,0,0.15); border: 1px dashed var(--border-color); padding: var(--space-md); border-radius: var(--radius-md);">
            <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
              🔌 ${t('walletLinked')}
            </span>
            <div style="display: flex; flex-direction: column; gap: var(--space-xs); margin-top: 6px; font-size: 0.85rem;">
              ${Object.entries(user.wallets || {}).filter(([chain]) => isWorldAppWebView() ? true : chain !== 'worldchain').length === 0 ? `
                <div style="color: var(--text-muted);">${t('profNoWallets')} <a href="#/wallet" style="color: var(--neon-cyan); font-weight: 600;">Wallet</a>.</div>
              ` : Object.entries(user.wallets || {}).filter(([chain]) => isWorldAppWebView() ? true : chain !== 'worldchain').map(([chain, address]) => `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px;">
                  <span style="text-transform: capitalize; color: var(--text-secondary); font-weight: 500;">${chain}:</span>
                  <span style="font-family: monospace; color: var(--neon-cyan); font-size: 0.75rem;">${address.slice(0, 6)}...${address.slice(-6)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Owner Stats -->
          <div id="owner-stats-container" style="display: none; background: rgba(0,245,255,0.05); border: 1px solid var(--neon-cyan); padding: var(--space-md); border-radius: var(--radius-md); box-shadow: 0 0 10px rgba(0,245,255,0.1);">
            <h3 style="font-family: var(--font-display); font-size: 1rem; color: var(--neon-cyan); margin-bottom: 8px;">📊 Dashboard de Rendimiento (Aave V3)</h3>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Capital Aportado:</span>
              <span id="owner-stats-deposit" style="color: var(--text-primary); font-weight: bold;">Cargando...</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Total Intereses Generados:</span>
              <span id="owner-stats-interest" style="color: var(--neon-green); font-weight: bold;">Cargando...</span>
            </div>
            
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,245,255,0.2);">
              <h4 style="font-family: var(--font-display); font-size: 0.8rem; color: var(--neon-purple); margin-bottom: 8px;">Desglose de Intereses</h4>
              
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2px;">
                <span>• 30% Owner / Proyecto:</span>
                <span id="owner-stats-profit-owner" style="color: var(--neon-cyan);">0.000000 USDC</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">
                <span>• 70% Para Repartir (Pozo de Juegos):</span>
                <span id="owner-stats-profit-pool" style="color: var(--neon-cyan);">0.000000 USDC</span>
              </div>

              <div style="padding-left: 10px; border-left: 2px solid var(--neon-purple); margin-left: 5px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">
                  <span>└ Pozo BlockDrop:</span>
                  <span id="owner-stats-blockdrop-total" style="color: var(--text-primary);">0.000000 USDC</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; padding-left: 15px;">
                  <span>🥇 1er Puesto (50%):</span>
                  <span id="owner-stats-bd-1st">0.000000 USDC</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; padding-left: 15px;">
                  <span>🥈 2do Puesto (30%):</span>
                  <span id="owner-stats-bd-2nd">0.000000 USDC</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; padding-left: 15px;">
                  <span>🥉 3er Puesto (10%):</span>
                  <span id="owner-stats-bd-3rd">0.000000 USDC</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; padding-left: 15px;">
                  <span>🏅 Siguientes Puestos (10%):</span>
                  <span id="owner-stats-bd-others">0.000000 USDC</span>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 15px; text-align: center;">
              <button id="btn-admin-withdraw" class="btn btn-primary hidden" style="width: 100%; font-family: var(--font-display); text-transform: uppercase;">Retirar Ganancia</button>
            </div>
            
            <div id="admin-withdraw-history" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,245,255,0.2);">
              <h4 style="font-family: var(--font-display); font-size: 0.8rem; color: var(--neon-purple); margin-bottom: 8px;">Historial de Retiros</h4>
              <ul id="admin-withdraw-list" style="list-style: none; padding: 0; margin: 0; font-size: 0.8rem; color: var(--text-secondary);"></ul>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md);">
            <button type="button" class="btn" id="btn-distribute-prizes" style="display: none; background: rgba(255, 165, 0, 0.1); border: 1px solid orange; color: orange; font-weight: bold; padding: 12px; font-family: var(--font-display);">
              ⚠️ PROBAR DISTRIBUCIÓN DE PREMIOS (ADMIN)
            </button>
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="btn-save-profile">
              💾 ${t('profSaveBtn')}
            </button>
            
            <button type="button" class="btn btn-secondary btn-full" id="btn-profile-logout" style="border: 1px solid rgba(255, 51, 102, 0.4); color: var(--neon-red); background: rgba(255, 51, 102, 0.03);">
              🚪 ${t('profLogout')}
            </button>
          </div>

        </form>
      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'profile');
  renderFooter(container.querySelector('.home-page'));
  setupProfile(selectedAvatar);
  loadReferralSection();
  
  const ADMIN_WALLETS = [
    '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
    '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
  ];
  const ownerEmail = 'frexland.online@gmail.com';
  const userWallets = Object.values(user.wallets || {}).concat(user.walletAddresses || []).map(addr => (addr || '').toLowerCase());
  const isOwner = userWallets.some(addr => ADMIN_WALLETS.includes(addr)) || (user.email === ownerEmail) || user.isAdmin === true;
  
  if (isOwner) {
    loadOwnerStats();
  }
}

async function loadReferralSection() {
  const user = getUser();
  if (!user) return;
  const userLevel = getUserLevel(user.total_depositado || 0);

  const codeContentEl = document.getElementById('referral-code-content');
  const applyBoxEl = document.getElementById('referral-apply-box');
  const transferContentEl = document.getElementById('referral-transfer-content');
  const statL1El = document.getElementById('ref-stat-l1');
  const statL2El = document.getElementById('ref-stat-l2');
  const statEarningsEl = document.getElementById('ref-stat-earnings');
  const creditsPillEl = document.getElementById('profile-my-credits-pill');

  try {
    const stats = await api.get('/wallet/referrals?t=' + Date.now());

    if (statL1El) statL1El.textContent = (stats.directReferrals || []).length;
    if (statL2El) statL2El.textContent = stats.indirectReferralsCount || 0;
    if (statEarningsEl) statEarningsEl.textContent = `${(stats.referral_earnings || 0).toFixed(2)} USDC`;

    // 1. Personal Referral Code UI
    if (codeContentEl) {
      if (!userLevel.canRefer) {
        codeContentEl.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.78rem; line-height: 1.4;">
            🔒 Alcanza <strong style="color: #cd7f32;">Rango Bronce (≥ 10 USDC)</strong> para desbloquear tu código de referido y ganar el 100% de los premios semanales.
          </div>
        `;
      } else if (stats.referral_code) {
        const refLink = `${window.location.origin}/#/auth?ref=${stats.referral_code}`;
        codeContentEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 245, 255, 0.08); border: 1px dashed var(--neon-cyan); padding: 8px 12px; border-radius: 6px;">
              <span style="font-family: var(--font-display); font-size: 1rem; font-weight: bold; color: var(--neon-cyan); letter-spacing: 1px;">${stats.referral_code}</span>
              <div style="display: flex; gap: 6px;">
                <button type="button" id="btn-copy-ref-code" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.72rem;">📋 Código</button>
                <button type="button" id="btn-copy-ref-link" class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.72rem;">🔗 Enlace</button>
              </div>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35;">
              Comparte tu código. En <strong>Plata (1%)</strong>, <strong>Oro (3%)</strong>, <strong>Platino (5% N1 + 1% N2)</strong> y <strong>Diamante (5% N1 + 3% N2)</strong> recibes comisión automática cuando tus referidos (Bronce+) ganan premios en el torneo semanal.
            </div>
          </div>
        `;
        document.getElementById('btn-copy-ref-code')?.addEventListener('click', () => {
          navigator.clipboard.writeText(stats.referral_code);
          showToast('Código de referido copiado', 'success');
        });
        document.getElementById('btn-copy-ref-link')?.addEventListener('click', () => {
          navigator.clipboard.writeText(refLink);
          showToast('Enlace de invitación copiado', 'success');
        });
      } else {
        codeContentEl.innerHTML = `
          <button type="button" id="btn-generate-ref-code" class="btn btn-primary btn-sm" style="width: 100%; font-family: var(--font-display);">
            ✨ Generar mi Código de Referido
          </button>
        `;
        document.getElementById('btn-generate-ref-code')?.addEventListener('click', async () => {
          try {
            const res = await api.post('/wallet/referral/generate', {});
            if (res.user) updateLocalUser(res.user);
            showToast(res.message || '¡Código generado!', 'success');
            loadReferralSection();
          } catch (err) {
            showToast(err.message || 'Error al generar código', 'error');
          }
        });
      }
    }

    // 2. Apply Referrer Code UI
    if (applyBoxEl) {
      if (!stats.referred_by) {
        applyBoxEl.style.display = 'block';
        const savedRef = localStorage.getItem('frex_ref_code');
        const inputEl = document.getElementById('input-apply-ref-code');
        if (savedRef && inputEl && !inputEl.value) {
          inputEl.value = savedRef;
        }
        const applyBtn = document.getElementById('btn-apply-ref-code');
        if (applyBtn && !applyBtn._bound) {
          applyBtn._bound = true;
          applyBtn.addEventListener('click', async () => {
            const code = document.getElementById('input-apply-ref-code')?.value?.trim();
            if (!code) {
              showToast('Ingresa un código de referido', 'warning');
              return;
            }
            try {
              applyBtn.disabled = true;
              const res = await api.post('/wallet/referral/apply', { code });
              if (res.user) updateLocalUser(res.user);
              localStorage.removeItem('frex_ref_code');
              showToast(res.message || '¡Código vinculado!', 'success');
              loadReferralSection();
            } catch (err) {
              showToast(err.message || 'Error al vincular código', 'error');
            } finally {
              applyBtn.disabled = false;
            }
          });
        }
      } else {
        applyBoxEl.style.display = 'none';
      }
    }

    // 3. Transfer Credits UI (Oro+)
    if (transferContentEl) {
      const currentUser = getUser();
      if (creditsPillEl) {
        creditsPillEl.textContent = `Disponibles: ${currentUser?.creditos_escritura || 0} créd.`;
      }
      if (!userLevel.canTransferCredits) {
        transferContentEl.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.76rem; line-height: 1.4;">
            🔒 Alcanza <strong style="color: #facc15;">Rango Oro (≥ 100 USDC)</strong> para transferir tus créditos de competencia semanales a tus referidos directos.
          </div>
        `;
      } else if (!stats.directReferrals || stats.directReferrals.length === 0) {
        transferContentEl.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.76rem;">
            Aún no tienes referidos directos vinculados para transferirles créditos. ¡Comparte tu código!
          </div>
        `;
      } else {
        transferContentEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <select id="select-transfer-referral" class="input-field" style="flex: 2; min-width: 150px; padding: 7px 10px; font-size: 0.8rem;">
                ${stats.directReferrals.map(r => `<option value="${r.id}">${r.username} (${r.creditos_escritura || 0} créd.)</option>`).join('')}
              </select>
              <input type="number" id="input-transfer-credits-amount" class="input-field" min="1" max="${currentUser?.creditos_escritura || 1}" value="1" placeholder="Cant." style="flex: 1; min-width: 70px; padding: 7px 10px; font-size: 0.8rem;">
            </div>
            <button type="button" id="btn-transfer-credits" class="btn btn-primary btn-sm" style="width: 100%; background: linear-gradient(90deg, #eab308, #ca8a04); color: #000; font-weight: 800;">
              📤 Enviar Créditos al Referido
            </button>
          </div>
        `;

        document.getElementById('btn-transfer-credits')?.addEventListener('click', async () => {
          const targetUserId = document.getElementById('select-transfer-referral')?.value;
          const amount = parseInt(document.getElementById('input-transfer-credits-amount')?.value, 10);
          if (!targetUserId || !amount || amount <= 0) {
            showToast('Selecciona un referido y una cantidad válida', 'warning');
            return;
          }
          try {
            const btn = document.getElementById('btn-transfer-credits');
            if (btn) btn.disabled = true;
            const res = await api.post('/wallet/transfer-credits', { targetUserId, amount });
            if (res.user) updateLocalUser(res.user);
            showToast(res.message || 'Créditos transferidos con éxito', 'success');
            loadReferralSection();
          } catch (err) {
            showToast(err.message || 'Error al transferir créditos', 'error');
            const btn = document.getElementById('btn-transfer-credits');
            if (btn) btn.disabled = false;
          }
        });
      }
    }
  } catch (err) {
    console.error('Error loading referral section:', err);
  }
}

async function loadOwnerStats() {
  const container = document.getElementById('owner-stats-container');
  const btnDistributePrizes = document.getElementById('btn-distribute-prizes');
  const btnAdminWithdraw = document.getElementById('btn-admin-withdraw');
  
  if (container) container.style.display = 'block';
  
  if (btnDistributePrizes) {
    btnDistributePrizes.style.display = 'block';
    btnDistributePrizes.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de ejecutar la distribución de premios manualmente? Esto vaciará los puntajes de competencia y asignará premios a los usuarios.')) {
        try {
          btnDistributePrizes.disabled = true;
          btnDistributePrizes.innerHTML = 'Procesando...';
          const res = await api.post('/admin/distribute-prizes', {});
          showToast(res.message || 'Distribución completada.', 'success');
        } catch (e) {
          showToast(e.message || 'Error al distribuir premios.', 'error');
        } finally {
          btnDistributePrizes.disabled = false;
          btnDistributePrizes.innerHTML = '⚠️ PROBAR DISTRIBUCIÓN DE PREMIOS (ADMIN)';
        }
      }
    });
  }
  
  if (btnAdminWithdraw) {
    btnAdminWithdraw.addEventListener('click', handleAdminWithdrawProfit);
  }
  
  let totalDeposited = 0;
  let interest = 0;
  let simulatedInterest = 0;
  let adminWithdrawn = 0;

  try {
    const res = await api.get('/admin/profit-stats?t=' + Date.now());
    adminWithdrawn = res.withdrawn || 0;
    totalDeposited = res.totalDeposited || 0;
    window.adminWithdrawHistory = res.history || [];
  } catch (e) {
    console.error(e);
  }

  let fastInterval;
  let slowInterval;

  const renderStats = (currentInterest) => {
    const depEl = document.getElementById('owner-stats-deposit');
    if (!depEl) {
      if (fastInterval) clearInterval(fastInterval);
      if (slowInterval) clearInterval(slowInterval);
      return;
    }
    depEl.textContent = `${totalDeposited.toFixed(6)} USDC`;
    document.getElementById('owner-stats-interest').textContent = `${currentInterest.toFixed(6)} USDC`;
    
    const ownerProfitGenerated = currentInterest * 0.30;
    const ownerProfitAvailable = Math.max(0, ownerProfitGenerated - adminWithdrawn);
    const poolProfit = currentInterest * 0.70;
    
    window.adminProfitAvailable = ownerProfitAvailable;
    
    document.getElementById('owner-stats-profit-owner').textContent = `${ownerProfitAvailable.toFixed(6)} USDC`;
    document.getElementById('owner-stats-profit-pool').textContent = `${poolProfit.toFixed(6)} USDC`;
    
    document.getElementById('owner-stats-blockdrop-total').textContent = `${poolProfit.toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-1st').textContent = `${(poolProfit * 0.50).toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-2nd').textContent = `${(poolProfit * 0.30).toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-3rd').textContent = `${(poolProfit * 0.10).toFixed(6)} USDC`;
    const othersEl = document.getElementById('owner-stats-bd-others');
    if (othersEl) othersEl.textContent = `${(poolProfit * 0.10).toFixed(6)} USDC`;
    
    const btnWithdrawEarnings = document.getElementById('btn-admin-withdraw');
    if (btnWithdrawEarnings) {
      if (ownerProfitAvailable > 0) {
        btnWithdrawEarnings.classList.remove('hidden');
        window.adminProfitAvailable = ownerProfitAvailable;
      } else {
        btnWithdrawEarnings.classList.add('hidden');
      }
    }
    
    const historyContainer = document.getElementById('admin-withdraw-history');
    const historyList = document.getElementById('admin-withdraw-list');
    if (historyContainer && historyList && window.adminWithdrawHistory && window.adminWithdrawHistory.length > 0) {
      historyContainer.style.display = 'block';
      historyList.innerHTML = window.adminWithdrawHistory.map(h => {
        const date = new Date(h.createdAt).toLocaleString();
        return `<li style="margin-bottom:4px; display:flex; justify-content:space-between;">
          <span>${date}</span>
          <span style="color:var(--neon-green)">+${h.amount.toFixed(6)} USDC</span>
        </li>`;
      }).join('');
    }
  };

  const fetchFromChain = async () => {
    try {
      const data = await getAaveFinancialData();
      const currentBalance = data.currentBalance || 0;
      interest = Math.max(0, currentBalance - totalDeposited);
      simulatedInterest = interest;
      renderStats(simulatedInterest);
    } catch (e) {
      console.error("Error loading on-chain stats:", e);
      const intEl = document.getElementById('owner-stats-interest');
      if (intEl) intEl.textContent = "Error al cargar desde Aave";
    }
  };

  await fetchFromChain();
  
  fastInterval = setInterval(() => {
    if (totalDeposited > 0) {
      const interestPerSecond = (totalDeposited * 0.04) / (365 * 24 * 60 * 60);
      simulatedInterest += (interestPerSecond / 10);
      renderStats(simulatedInterest);
    }
  }, 100);

  slowInterval = setInterval(fetchFromChain, 10000);
}

async function handleAdminWithdrawProfit() {
  const amount = window.adminProfitAvailable || 0;
  if (amount <= 0) {
    showToast('No hay ganancias para retirar', 'warning');
    return;
  }
  
  try {
    showToast('Iniciando retiro en la blockchain...', 'info');
    const amountWei = parseUnits(amount.toFixed(6).toString(), 6);
    await withdrawUSDC(amountWei);

    const res = await api.post('/admin/withdraw-profit', { amount });
    showToast(res.message, 'success');
    setTimeout(() => window.location.reload(), 1500);
  } catch (e) {
    showToast(e.message || 'Error al retirar', 'error');
  }
}

function setupProfile(selectedAvatar) {
  let activeAvatarUrl = selectedAvatar;
  const avatarPreviewImg = document.getElementById('avatar-preview-img');

  const updateAvatarPreview = (url) => {
    activeAvatarUrl = url;
    if (avatarPreviewImg) avatarPreviewImg.src = url;
  };

  document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', (e) => {
      document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.style.borderColor = 'var(--border-color)';
        opt.classList.remove('selected');
      });
      const opt = e.currentTarget;
      opt.style.borderColor = 'var(--neon-cyan)';
      opt.classList.add('selected');
      updateAvatarPreview(opt.dataset.url);
    });
  });

  const avatarUploadInput = document.getElementById('avatar-upload');
  avatarUploadInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen es muy pesada (máximo 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 150;

        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height *= maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width *= maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        document.querySelectorAll('.avatar-option').forEach(opt => {
          opt.style.borderColor = 'var(--border-color)';
          opt.classList.remove('selected');
        });
        updateAvatarPreview(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Guardando...';
    }

    const username = document.getElementById('profile-username').value.trim();
    const twitter = document.getElementById('profile-twitter').value.trim();
    const discord = document.getElementById('profile-discord').value.trim();
    const telegram = document.getElementById('profile-telegram').value.trim();

    try {
      const response = await api.put('/auth/profile', {
        username,
        avatarUrl: activeAvatarUrl,
        twitter,
        discord,
        telegram
      });

      updateLocalUser(response.user);
      showToast('¡Perfil actualizado con éxito!', 'success');
      renderNavbar(document.getElementById('navbar-container'), 'profile');
    } catch (err) {
      showToast(err.message || 'Error al guardar los cambios del perfil', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Guardar Cambios';
      }
    }
  });

  document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
    logout();
    window.location.hash = '#/auth';
  });
}
