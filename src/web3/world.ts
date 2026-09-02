import { MiniKit } from '@worldcoin/minikit-js';

/**
 * Detecta si la web app se está ejecutando dentro de World App
 */
export function isWorldAppWebView(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (MiniKit.isInstalled() && MiniKit.isInWorldApp()) {
      return true;
    }
  } catch (e) {}

  return Boolean(
    (window as any).WorldApp || 
    (window as any).webkit?.messageHandlers?.minikit || 
    (window as any).Android?.postMessage ||
    navigator.userAgent?.toLowerCase().includes('worldapp') ||
    window.location.search?.includes('worldapp=true')
  );
}

/**
 * Inicia el proceso de autenticación con World App (SIWE)
 */
export async function authenticateWorld(): Promise<any> {
  // Asegurar que MiniKit esté instalado antes de usarlo (por si window.WorldApp cargó tarde)
  try {
    MiniKit.install('app_16b6ce75c2caa92d0fd4d4e1f42cc2f6');
  } catch (e) {
    // Ignorar si falla
  }

  // Generamos un nonce (en producción debería venir del backend para evitar replay attacks)
  const nonce = crypto.randomUUID().replace(/-/g, '');

  try {
    const response = await MiniKit.walletAuth({
      nonce: nonce,
      requestId: '0', // Opcional pero a veces requerido por la API
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement: 'Inicia sesion en Frexland y Blockdrop',
    });

    if (response && response.data && response.data.address) {
      return response.data; // Devuelve address, signature, message
    } else if (response && response.status === 'success') {
      return response.payload || response; // Fallback para versiones antiguas
    } else {
      throw new Error(`Autenticación cancelada o fallida en World App`);
    }
  } catch (error) {
    console.error("Error en authenticateWorld:", error);
    throw error;
  }
}

/**
 * Método wrapper para enviar transacciones usando MiniKit
 */
export async function sendWorldTransaction(txPayload: any): Promise<any> {
  if (!isWorldAppWebView()) {
    throw new Error("World App no detectada");
  }
  
  try {
    const response = await MiniKit.sendTransaction(txPayload);
    return response;
  } catch (error) {
    console.error("Error en sendWorldTransaction:", error);
    throw error;
  }
}
