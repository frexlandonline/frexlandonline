// Módulo de integración para Lemon Cash Mini App SDK

// Bandera para forzar entorno de simulación local (mock) durante el desarrollo.
// Poner en true para simular estar en el navegador de Lemon en PC.
export const DEBUG_SIMULATE_LEMON = localStorage.getItem('DEBUG_SIMULATE_LEMON') === 'true';

let sdk = null;

try {
  // Intentamos cargar el SDK. Si no está instalado o da error (entorno no compatible), atrapamos el error.
  import('@lemoncash/mini-app-sdk').then(m => {
    sdk = m;
  }).catch(e => console.log('Lemon SDK no cargado nativamente, operando con mocks.'));
} catch(e) {}

/**
 * Detecta si la web app se está ejecutando dentro del WebView de Lemon Cash.
 */
export function isLemonWebView() {
  // El SDK oficial proveería un método isWebView o podemos chequear el user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  // Lemon Cash suele inyectar variables en window o modificar el UserAgent. 
  // Esta es una comprobación genérica adaptada a la especificación.
  return (window.lemon || userAgent.includes('LemonCash') || (sdk && sdk.isWebView && sdk.isWebView()));
}

/**
 * Inicia el proceso de autenticación silenciosa con Lemon
 */
export async function authenticateLemon() {
  if (DEBUG_SIMULATE_LEMON) {
    console.log('[LEMON MOCK] Autenticando usuario simulado...');
    return new Promise(resolve => setTimeout(() => resolve({
      result: 'SUCCESS',
      data: {
        wallet: '0xLemonMockWalletAddress1234567890ABCDEF'
      }
    }), 1000));
  }

  if (sdk && sdk.authenticate) {
    // ChainId: POLYGON_AMOY = 80002, POLYGON_MAINNET = 137
    return await sdk.authenticate({ chainId: 137 }); // Asumimos mainnet o la red de base soportada
  }

  throw new Error("Lemon SDK no disponible");
}

/**
 * Solicita un depósito. En Lemon, esto abre el bottom-sheet nativo donde 
 * el usuario puede elegir pagar con ARS o crypto.
 */
export async function depositLemon(amount, tokenName = 'USDC') {
  if (DEBUG_SIMULATE_LEMON) {
    console.log(`[LEMON MOCK] Solicitando depósito de ${amount} ${tokenName}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulamos éxito o rechazo aleatorio
        if (Math.random() > 0.1) {
          resolve({ txHash: '0xMockTxHash' + Date.now() });
        } else {
          reject(new Error('El usuario canceló la transacción en Lemon.'));
        }
      }, 2000);
    });
  }

  if (sdk && sdk.deposit) {
    return await sdk.deposit({ amount: String(amount), tokenName });
  }

  throw new Error("Lemon SDK no disponible para depósitos");
}

/**
 * Solicita un retiro. En Lemon, esto abre el bottom-sheet nativo donde 
 * el usuario puede elegir recibir en ARS o crypto.
 */
export async function withdrawLemon(amount, tokenName = 'USDC') {
  if (DEBUG_SIMULATE_LEMON) {
    console.log(`[LEMON MOCK] Solicitando retiro de ${amount} ${tokenName}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulamos éxito o rechazo aleatorio
        if (Math.random() > 0.1) {
          resolve({ txHash: '0xMockTxHash' + Date.now() });
        } else {
          reject(new Error('El usuario canceló la transacción en Lemon.'));
        }
      }, 2000);
    });
  }

  if (sdk && sdk.withdraw) {
    return await sdk.withdraw({ amount: String(amount), tokenName });
  }

  throw new Error("Lemon SDK no disponible para retiros");
}
