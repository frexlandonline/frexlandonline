import api from './api.js';

const TOKEN_KEY = 'blockdrop_token';
const USER_KEY = 'blockdrop_user';

let currentUser = null;
let onAuthChangeCallbacks = [];

export function onAuthChange(cb) {
  onAuthChangeCallbacks.push(cb);
  return () => { onAuthChangeCallbacks = onAuthChangeCallbacks.filter(c => c !== cb); };
}

function notifyAuthChange() {
  onAuthChangeCallbacks.forEach(cb => cb(currentUser));
}

function saveSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY); // Clean legacy
  localStorage.removeItem(USER_KEY);
  currentUser = user;
  notifyAuthChange();
}

export function getUser() {
  if (currentUser) return currentUser;
  try {
    const stored = sessionStorage.getItem(USER_KEY);
    if (stored) { currentUser = JSON.parse(stored); return currentUser; }
  } catch (e) {}
  return null;
}

export function isLoggedIn() {
  return !!sessionStorage.getItem(TOKEN_KEY) && !!getUser();
}

export async function register(email, password, username) {
  const data = await api.post('/auth/register', { email, password, username });
  saveSession(data.token, data.user);
  return data;
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  saveSession(data.token, data.user);
  return data;
}

export async function verifyEmail(code) {
  const data = await api.post('/auth/verify-email', { code });
  if (data.user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    currentUser = data.user;
    notifyAuthChange();
  }
  return data;
}

export async function resendCode() {
  return api.post('/auth/resend-code', {});
}

export async function loginWithMetaMask(walletAddress, username, chain, message, signature) {
  const data = await api.post('/auth/metamask-login', { walletAddress, username, chain, message, signature });
  saveSession(data.token, data.user);
  return data;
}

export async function loginWithGoogle(googleData) {
  const data = await api.post('/auth/google', googleData);
  saveSession(data.token, data.user);
  return data;
}

export async function loginWithLemon(walletAddress) {
  // En un entorno real, Lemon firmaría un mensaje o enviaría un token JWT de Lemon
  // Para la demo, el backend aceptará la dirección validada por el WebView
  const data = await api.post('/auth/lemon', { walletAddress });
  saveSession(data.token, data.user);
  return data;
}

export async function loginWithWorld(walletAddress, message, signature) {
  const data = await api.post('/auth/world', { walletAddress, message, signature });
  saveSession(data.token, data.user);
  return data;
}

export async function fetchCurrentUser() {
  try {
    const data = await api.get('/auth/me');
    currentUser = data.user;
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    notifyAuthChange();
    return data.user;
  } catch (e) {
    logout();
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY); // Clean legacy
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  notifyAuthChange();
  
  // Por seguridad, desconectamos cualquier billetera activa
  import('../web3/wallet.ts')
    .then(module => {
      module.disconnectWallet();
    })
    .catch(err => console.error("Error al desconectar billetera en logout:", err));
}

export function updateLocalUser(user) {
  currentUser = user;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
}
