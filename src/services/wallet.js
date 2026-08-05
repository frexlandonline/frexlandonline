import api from './api.js';

const POLYGON_CHAIN_ID = '0x89'; // 137 in hex

export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado. Por favor instálalo desde metamask.io');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No se pudo conectar a MetaMask');
  }

  return accounts[0];
}

export async function switchToPolygon() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: POLYGON_CHAIN_ID,
          chainName: 'Polygon Mainnet',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com'],
          blockExplorerUrls: ['https://polygonscan.com/'],
        }],
      });
    }
  }
}

export async function getPolygonTokens(address) {
  const data = await api.get(`/wallet/tokens/${address}`);
  return data.tokens;
}

export async function saveWalletToAccount(walletAddress) {
  return api.post('/wallet/connect', { walletAddress });
}

export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function onAccountsChanged(callback) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
}
