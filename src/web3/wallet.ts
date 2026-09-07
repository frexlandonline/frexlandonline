import { disconnect, getAccount, watchAccount, switchChain, reconnect, signMessage } from '@wagmi/core';
import { config, wagmiAdapter, projectId } from './config';
import { showToast } from '../main.js';
import { base } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit';

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base],
  projectId,
  features: {
    analytics: false
  }
});

export interface WalletState {
  address: `0x${string}` | null;
  isConnected: boolean;
  chainId: number | null;
}

export async function connectWallet(): Promise<`0x${string}`> {
  const account = getAccount(config);
  if (account.isConnected && account.address) {
    await ensureBaseMainnet();
    return account.address;
  }

  await modal.open();
  
  // Return address after connection if possible, though watchAccount usually handles UI
  const newAccount = getAccount(config);
  return newAccount.address || '0x0';
}

export async function disconnectWallet(): Promise<void> {
  try {
    await disconnect(config);
  } catch (e) {
    console.warn('Wagmi disconnect error:', e);
  }

  try {
    await modal.close();
  } catch (e) {}

  // Limpiar llaves residuales de Wagmi, AppKit y WalletConnect del almacenamiento local
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('wagmi') ||
        key.startsWith('@appkit') ||
        key.startsWith('@w3m') ||
        key.startsWith('wc@') ||
        key.startsWith('reown')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing wallet storage:', e);
  }
}

export function getConnectedAddress(): `0x${string}` | null {
  const account = getAccount(config);
  return account.address || null;
}

export async function ensureBaseMainnet(): Promise<void> {
  const account = getAccount(config);
  if (account.chainId !== base.id) {
    try {
      await switchChain(config, { chainId: base.id });
      showToast('Cambiado a red Base Mainnet', 'success');
    } catch (err) {
      console.error('Error al cambiar de red:', err);
      showToast('Por favor cambia la red a Base Mainnet en tu billetera', 'warning');
      throw err;
    }
  }
}

export function subscribeToAccountChanges(callback: (state: WalletState) => void) {
  return watchAccount(config, {
    onChange(account) {
      callback({
        address: account.address || null,
        isConnected: account.isConnected,
        chainId: account.chainId || null
      });
    }
  });
}

// Auto-reconnect Wagmi session
try {
  reconnect(config);
} catch(e) {}

export async function signAuthMessage(message: string): Promise<string> {
  const account = getAccount(config);
  if (!account.isConnected || !account.address) {
    throw new Error("No hay billetera conectada");
  }
  return await signMessage(config, { message });
}
