import { t } from '../utils/i18n.js';
import { login, register, isLoggedIn as checkAuth, getUser as getPendingVerificationUser, logout, loginWithGoogle } from '../services/auth.js';
import { showToast } from '../main.js';
import api from '../services/api.js';
import { checkAndShowTermsModal } from '../components/termsModal.js';
import { checkAndShowWinnerModal } from '../components/winnerModal.js';

let currentTab = 'login';
let cachedGoogleClientId = null;

export function renderAuthPage(container) {
  const user = getPendingVerificationUser();
  if (user && !user.emailVerified && user.email) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-logo">
            <span class="auth-logo-icon" style="font-size: 2.8rem;">🕹️</span>
            <div class="auth-logo-text" style="font-family: 'Press Start 2P', cursive; font-size: clamp(1.2rem, 5.5vw, 1.8rem); color: var(--neon-cyan); text-shadow: 3px 3px 0 var(--neon-magenta), 6px 6px 0 var(--neon-purple); margin-bottom: 8px; line-height: 1.3;">FREXLAND</div>
            <div class="auth-logo-sub" style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.55rem, 2.5vw, 0.75rem); color: var(--neon-purple); margin-top: 10px; text-shadow: 1px 1px 2px #000;">${t('authSubtitle')}</div>
          </div>
          <div id="verify-modal-container"></div>
        </div>
      </div>
    `;
    showVerifyModal(user.email, true);
    return;
  }

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-logo">
          <span class="auth-logo-icon" style="font-size: 2.8rem;">🕹️</span>
          <div class="auth-logo-text" style="font-family: 'Press Start 2P', cursive; font-size: clamp(1.2rem, 5.5vw, 1.8rem); color: var(--neon-cyan); text-shadow: 3px 3px 0 var(--neon-magenta), 6px 6px 0 var(--neon-purple); margin-bottom: 8px; line-height: 1.3;">FREXLAND</div>
          <div class="auth-logo-sub" style="font-family: 'Press Start 2P', cursive; font-size: clamp(0.55rem, 2.5vw, 0.75rem); color: var(--neon-purple); margin-top: 10px; text-shadow: 1px 1px 2px #000;">${t('authSubtitle')}</div>
        </div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab ${currentTab === 'login' ? 'active' : ''}" id="tab-login">${t('authLoginTab')}</button>
            <button class="auth-tab ${currentTab === 'register' ? 'active' : ''}" id="tab-register">${t('authRegTab')}</button>
          </div>
          <div id="auth-form-container"></div>
          <div class="divider">${t('authOrContinue')}</div>
          <div class="auth-social">
            <button class="btn btn-google btn-full" id="btn-google">
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
    <div id="verify-modal-container"></div>
  `;

  renderForm();
  bindEvents(container);

  if (!cachedGoogleClientId) {
    api.get('/auth/config').then(config => {
      cachedGoogleClientId = config.googleClientId;
    }).catch(err => {
      console.warn('Failed to pre-fetch Google config:', err);
    });
  }
}


function renderForm() {
  const formContainer = document.getElementById('auth-form-container');
  if (!formContainer) return;

  if (currentTab === 'login') {
    formContainer.innerHTML = `
      <form class="auth-form" id="auth-form">
        <div class="input-group">
          <label for="login-email">${t('authEmail')}</label>
          <input type="email" id="login-email" class="input-field" placeholder="tu@email.com" required autocomplete="email">
        </div>
        <div class="input-group">
          <label for="login-password">${t('authPassword')}</label>
          <input type="password" id="login-password" class="input-field" placeholder="••••••••" required autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="btn-submit">${t('authSubmitLogin')}</button>
      </form>
    `;
  } else {
    formContainer.innerHTML = `
      <form class="auth-form" id="auth-form">
        <div class="input-group">
          <label for="reg-username">${t('authUsername')}</label>
          <input type="text" id="reg-username" class="input-field" placeholder="${t('authUsernamePlaceholder')}" required minlength="2" autocomplete="username">
        </div>
        <div class="input-group">
          <label for="reg-email">${t('authEmail')}</label>
          <input type="email" id="reg-email" class="input-field" placeholder="tu@email.com" required autocomplete="email">
        </div>
        <div class="input-group">
          <label for="reg-password">${t('authPassword')}</label>
          <input type="password" id="reg-password" class="input-field" placeholder="${t('authPassPlaceholder')}" required minlength="6" autocomplete="new-password">
        </div>
        <div class="input-group">
          <label for="reg-password-confirm">${t('authConfirmPass')}</label>
          <input type="password" id="reg-password-confirm" class="input-field" placeholder="${t('authConfirmPassPlaceholder')}" required minlength="6" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="btn-submit">${t('authSubmitReg')}</button>
      </form>
    `;
  }
}

function bindEvents(container) {
  document.getElementById('tab-login')?.addEventListener('click', () => {
    currentTab = 'login';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-login').classList.add('active');
    renderForm();
    bindFormSubmit();
  });

  document.getElementById('tab-register')?.addEventListener('click', () => {
    currentTab = 'register';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-register').classList.add('active');
    renderForm();
    bindFormSubmit();
  });
  document.getElementById('btn-google')?.addEventListener('click', handleGoogle);
  bindFormSubmit();
}

function bindFormSubmit() {
  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Cargando...';

    try {
      if (currentTab === 'login') {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await login(email, password);
        if (data.requiresVerification) {
          showVerifyModal(email, true);
        } else {
          showToast('¡Bienvenido de vuelta!', 'success');
          checkAndShowWinnerModal();
          window.location.hash = '#/home';
        }
      } else {
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;

        if (password !== passwordConfirm) {
          showToast('Las contraseñas no coinciden', 'error');
          // Reset button state manually since blockFormSubmit handles it in finally
          throw new Error('Las contraseñas no coinciden');
        }

        await register(email, password, username);
        showVerifyModal(email, true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = currentTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
    }
  });
}


async function handleGoogle() {
  const btn = document.getElementById('btn-google');
  if (btn) btn.disabled = true;

  try {
    let googleClientId = cachedGoogleClientId;
    
    if (!googleClientId) {
      // Fallback si no terminó de cargar
      const config = await api.get('/auth/config');
      googleClientId = config.googleClientId;
      cachedGoogleClientId = googleClientId;
    }

    if (googleClientId && googleClientId !== 'your-google-client-id') {
      if (typeof google === 'undefined') {
        showToast('El SDK de Google no se ha cargado. Revisa tu conexión a internet.', 'error');
        if (btn) btn.disabled = false;
        return;
      }

      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Conectando...';

      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              const googleUser = await res.json();

              const data = await loginWithGoogle({
                googleId: googleUser.sub,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${googleUser.sub}`
              });

              showToast('¡Sesión iniciada con Google!', 'success');
              window.location.hash = '#/home';
            } catch (err) {
              console.error('Error in Google auth flow:', err);
              showToast(err.message || 'Error al iniciar sesión con Google', 'error');
            } finally {
              if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
              }
            }
          } else {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          }
        },
        error_callback: (err) => {
          console.error('Google SDK client error:', err);
          showToast('Error al conectar con Google', 'error');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        }
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } else {
      showToast('GOOGLE_CLIENT_ID no configurado. Iniciando simulación para desarrollo...', 'info');
      showGoogleMockModal();
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error('Failed to query google auth config:', err);
    showToast('Error al consultar configuración de Google en el servidor', 'error');
    if (btn) btn.disabled = false;
  }
}

function showVerifyModal(email, forced = false) {
  const modal = document.getElementById('verify-modal-container');
  modal.innerHTML = `
    <div class="modal-backdrop" id="verify-backdrop">
      <div class="modal">
        ${forced ? '' : '<button class="modal-close" id="verify-close">✕</button>'}
        <div class="verify-modal-title text-gradient">Verificar Email</div>
        <p class="verify-modal-desc">
          Enviamos un código de 6 dígitos a<br>
          <span class="verify-email-highlight">${email}</span>
        </p>
        <div class="code-input-group" id="code-inputs">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="0">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="1">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="2">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="3">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="4">
          <input type="text" class="code-digit" maxlength="1" inputmode="numeric" data-idx="5">
        </div>
        <div class="verify-actions">
          <button class="btn btn-primary btn-full" id="btn-verify">Verificar</button>
          <button class="verify-resend" id="btn-resend">¿No recibiste el código? Reenviar</button>
          ${forced ? '<button class="verify-resend" id="btn-logout-verify">Volver / Cerrar Sesión</button>' : '<button class="verify-resend" id="btn-skip">Saltar por ahora</button>'}
        </div>
      </div>
    </div>
  `;

  // Auto-focus and auto-advance code inputs
  const inputs = modal.querySelectorAll('.code-digit');
  inputs[0]?.focus();

  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val;
      if (val && idx < 5) inputs[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        inputs[idx - 1].focus();
      }
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      for (let i = 0; i < paste.length; i++) {
        if (inputs[i]) inputs[i].value = paste[i];
      }
      if (paste.length > 0) inputs[Math.min(paste.length, 5)].focus();
    });
  });

  document.getElementById('btn-verify')?.addEventListener('click', async () => {
    const code = Array.from(inputs).map(i => i.value).join('');
    if (code.length !== 6) { showToast('Ingresa el código completo', 'error'); return; }
    try {
      await verifyEmail(code);
      showToast('¡Email verificado!', 'success');
      modal.innerHTML = '';
      window.location.hash = '#/home';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-resend')?.addEventListener('click', async () => {
    try {
      await resendCode();
      showToast('Nuevo código enviado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  if (forced) {
    document.getElementById('btn-logout-verify')?.addEventListener('click', () => {
      logout();
      window.location.hash = '#/auth';
      window.location.reload();
    });
  } else {
    document.getElementById('btn-skip')?.addEventListener('click', () => {
      modal.innerHTML = '';
      window.location.hash = '#/home';
    });

    document.getElementById('verify-close')?.addEventListener('click', () => {
      modal.innerHTML = '';
      window.location.hash = '#/home';
    });
  }
}

function showGoogleMockModal() {
  const modalContainer = document.getElementById('verify-modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-backdrop" id="google-mock-backdrop">
      <div class="modal card-glass" style="max-width: 400px; border: 1px solid var(--border-glow); padding: var(--space-xl); position: relative;">
        <button class="modal-close" id="google-mock-close">✕</button>
        <div class="modal-title text-gradient text-center" style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);">
          🛠️ Google Sign-In (Demo)
        </div>
        <p class="text-center" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md); line-height: 1.4;">
          Simulación de inicio de sesión con Google para desarrollo local.
        </p>
        <form id="google-mock-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div class="input-group">
            <label for="mock-google-name">Nombre</label>
            <input type="text" id="mock-google-name" class="input-field" placeholder="Ej. Juan Pérez" required>
          </div>
          <div class="input-group">
            <label for="mock-google-email">Correo Electrónico</label>
            <input type="email" id="mock-google-email" class="input-field" placeholder="ejemplo@gmail.com" required>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="btn-mock-google-submit">
            Confirmar Acceso Demo
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('google-mock-close')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  document.getElementById('google-mock-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('mock-google-name').value;
    const email = document.getElementById('mock-google-email').value;
    const btn = document.getElementById('btn-mock-google-submit');

    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      const mockGoogleId = `google_mock_${Date.now()}`;
      const mockPicture = `https://api.dicebear.com/7.x/bottts/svg?seed=${mockGoogleId}`;

      const data = await loginWithGoogle({
        googleId: mockGoogleId,
        email,
        name,
        picture: mockPicture
      });

      showToast(`¡Sesión simulada exitosamente como ${data.user.username}!`, 'success');
      modalContainer.innerHTML = '';
      window.location.hash = '#/home';
    } catch (err) {
      showToast(err.message || 'Error al procesar login de Google simulado', 'error');
      btn.disabled = false;
      btn.textContent = 'Confirmar Acceso Demo';
    }
  });
}



