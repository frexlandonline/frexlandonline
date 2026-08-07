import { getUser, logout, updateLocalUser } from '../services/auth.js';
import { wrapWithBadge } from '../components/avatarBadge.js';
import { renderNavbar } from '../components/navbar.js';
import { showToast } from '../main.js';
import api from '../services/api.js';
import { renderFooter } from '../components/footer.js';
import { getAaveFinancialData, withdrawUSDC } from '../web3/contract.ts';
import { parseUnits } from 'viem';

export function renderProfilePage(container) {
  const user = getUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  // Predefined avatar seeds for Dicebear Bottts
  const avatarSeeds = ['CyberBot', 'NeonPlayer', 'ByteGamer', 'GridRunner', 'CryptoNerd'];
  let selectedAvatar = user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'Player'}`;

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="home-page" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 120px var(--space-md) var(--space-xl);">
      <div class="card card-glass" style="width: 100%; max-width: 500px; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-neon-purple); position: relative; overflow: hidden;">
        
        <div style="text-align: center; margin-bottom: var(--space-xl);">
          <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.8rem; letter-spacing: 1px; text-shadow: 0 0 10px rgba(139, 92, 246, 0.4);">
            ⚙️ MI PERFIL
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
            Personaliza tus datos de juego y visualización
          </p>
        </div>

        <form id="profile-form" style="display: flex; flex-direction: column; gap: var(--space-lg);">
          
          <!-- Avatar Preview and Chooser -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; padding-bottom: var(--space-md); border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: center;">
              ${wrapWithBadge(`<img id="avatar-preview-img" src="${selectedAvatar}" style="width: 96px; height: 96px; border-radius: 50%; border: 2px solid #000; background: var(--bg-secondary); object-fit: cover; box-sizing: border-box;">`, user.platform || 'html5')}
            </div>
            
            <div style="text-align: center; width: 100%;">
              <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                Elige tu Avatar
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
                  Sube tu propia imagen
                </label>
                <input type="file" id="avatar-upload" accept="image/jpeg, image/png, image/webp" style="display: none;">
              </div>
            </div>
          </div>

          <!-- Email (Read Only) -->
          <div class="input-group">
            <label>Correo Electrónico (Verificado)</label>
            <input type="email" value="${user.email || 'Conectado con Wallet'}" class="input-field" disabled style="opacity: 0.6; cursor: not-allowed; background: rgba(0,0,0,0.2);">
          </div>

          <!-- Username -->
          <div class="input-group">
            <label for="profile-username">Nombre de Usuario</label>
            <input type="text" id="profile-username" class="input-field" value="${user.username || ''}" required minlength="2" placeholder="Tu nombre en el ranking" autocomplete="username">
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

          <!-- Wallets count / details -->
          <div class="input-group" style="background: rgba(0,0,0,0.15); border: 1px dashed var(--border-color); padding: var(--space-md); border-radius: var(--radius-md);">
            <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
              🔌 Billeteras Vinculadas
            </span>
            <div style="display: flex; flex-direction: column; gap: var(--space-xs); margin-top: 6px; font-size: 0.85rem;">
              ${Object.entries(user.wallets || {}).length === 0 ? `
                <div style="color: var(--text-muted);">Ninguna billetera vinculada. Puedes vincularlas en la sección <a href="#/wallet" style="color: var(--neon-cyan); font-weight: 600;">Wallet</a>.</div>
              ` : Object.entries(user.wallets).map(([chain, address]) => `
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
                <span>• 30% Owner / Desarrollo:</span>
                <span id="owner-stats-profit-owner" style="color: var(--neon-cyan);">0.000000 USDC</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">
                <span>• 70% Para Repartir (Pozo de Premios):</span>
                <span id="owner-stats-profit-pool" style="color: var(--neon-cyan);">0.000000 USDC</span>
              </div>

              <div style="padding-left: 10px; border-left: 2px solid var(--neon-purple); margin-left: 5px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">
                  <span>└ 100% BlockDrop:</span>
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
                  <span>🥉 3er Puesto (20%):</span>
                  <span id="owner-stats-bd-3rd">0.000000 USDC</span>
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
              💾 Guardar Cambios
            </button>
            
            <button type="button" class="btn btn-secondary btn-full" id="btn-profile-logout" style="border: 1px solid rgba(255, 51, 102, 0.4); color: var(--neon-red); background: rgba(255, 51, 102, 0.03);">
              🚪 Cerrar Sesión
            </button>
          </div>

        </form>
      </div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'profile');
  renderFooter(container.querySelector('.home-page'));
  setupProfile(selectedAvatar);
  
  const ownerAddress = '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase();
  const ownerEmail = 'frexland.online@gmail.com';
  const isOwner = (Object.values(user.wallets || {}).some(addr => addr && addr.toLowerCase() === ownerAddress)) || (user.email === ownerEmail);
  
  if (isOwner) {
    loadOwnerStats();
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
      if (confirm('¿Estás seguro de ejecutar la distribución de premios manualmente? Esto vaciará los puntajes y asignará premios a los usuarios.')) {
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
    // Usamos el total depositado real desde la base de datos
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
    
    // El profit del owner generado históricamente es el 30% del interés, pero hay que descontar lo que ya retiró.
    const ownerProfitGenerated = currentInterest * 0.30;
    const ownerProfitAvailable = Math.max(0, ownerProfitGenerated - adminWithdrawn);
    const poolProfit = currentInterest * 0.70;
    
    // Guardamos el disponible en el window para el boton
    window.adminProfitAvailable = ownerProfitAvailable;
    
    document.getElementById('owner-stats-profit-owner').textContent = `${ownerProfitAvailable.toFixed(6)} USDC`;
    document.getElementById('owner-stats-profit-pool').textContent = `${poolProfit.toFixed(6)} USDC`;
    
    // 100% to BlockDrop currently
    document.getElementById('owner-stats-blockdrop-total').textContent = `${poolProfit.toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-1st').textContent = `${(poolProfit * 0.50).toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-2nd').textContent = `${(poolProfit * 0.30).toFixed(6)} USDC`;
    document.getElementById('owner-stats-bd-3rd').textContent = `${(poolProfit * 0.20).toFixed(6)} USDC`;
    
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
      // Ya no usamos data.totalDeposited del contrato porque no refleja los premios y retiros correctamente off-chain
      // Calculamos el interés en base al balance total en aave (data.currentBalance) menos el capital total (base de datos)
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

  // Initial fetch
  await fetchFromChain();
  
  // Aave APY ~4% base. Calculate interest per 100ms.
  fastInterval = setInterval(() => {
    if (totalDeposited > 0) {
      const interestPerSecond = (totalDeposited * 0.04) / (365 * 24 * 60 * 60);
      simulatedInterest += (interestPerSecond / 10);
      renderStats(simulatedInterest);
    }
  }, 100);

  // Re-sync with blockchain every 10 seconds to correct drift
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
  const customSeedInput = document.getElementById('avatar-custom-seed');

  // Helper to update preview
  const updateAvatarPreview = (url) => {
    activeAvatarUrl = url;
    if (avatarPreviewImg) avatarPreviewImg.src = url;
  };

  // Avatar seed selectors click handlers
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

  // Custom image upload changes
  const avatarUploadInput = document.getElementById('avatar-upload');
  avatarUploadInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (e.g., limit to 2MB before compression)
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
        const maxSize = 150; // Pequeño y liviano

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

  // Save changes submit handler
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

      // Update local storage user session
      updateLocalUser(response.user);

      showToast('¡Perfil actualizado con éxito!', 'success');
      
      // Refresh Navbar
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

  // Logout button handler
  document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
    logout();
    window.location.hash = '#/auth';
  });
}
