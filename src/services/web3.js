import { BrowserProvider, Contract, AbiCoder } from 'ethers';
import api from './api.js';

// Constantes de red para World Chain
const WORLD_CHAIN_ID = '0x1e0'; // 480 en hexadecimal
const WORLD_CHAIN_CONFIG = {
  chainId: WORLD_CHAIN_ID,
  chainName: 'World Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/public'],
  blockExplorerUrls: ['https://worldscan.org']
};

// Configuración del contrato (Placeholders que actualizará el Agente 1)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: Reemplazar con la dirección real del contrato
const CONTRACT_ABI = [
  // TODO: Reemplazar con el ABI real provisto por el Agente 1
  "function submitScore(uint256 score, uint256 root, uint256 nullifierHash, uint256[8] proof) external"
];

let provider = null;
let signer = null;

/**
 * Inicializa el proveedor de ethers con window.ethereum
 */
function initProvider() {
  if (typeof window.ethereum !== 'undefined') {
    provider = new BrowserProvider(window.ethereum);
  } else {
    console.error("MetaMask o billetera Web3 no instalada");
  }
}

/**
 * Conecta la wallet, solicita permisos y retorna la dirección
 */
export async function connectWallet() {
  if (!provider) initProvider();
  if (!provider) throw new Error("No Web3 provider found");
  
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  return address;
}

/**
 * Cambia la red a World Chain, agregándola si no existe
 */
export async function switchToWorldChain() {
  if (!provider) initProvider();
  if (!provider) return;

  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId: WORLD_CHAIN_ID }]);
  } catch (switchError) {
    // Si la red no existe (código 4902), intentamos agregarla
    if (switchError.code === 4902) {
      try {
        await provider.send('wallet_addEthereumChain', [WORLD_CHAIN_CONFIG]);
      } catch (addError) {
        console.error("Error al agregar World Chain:", addError);
        throw addError;
      }
    } else {
      console.error("Error al cambiar a World Chain:", switchError);
      throw switchError;
    }
  }
}

/**
 * Obtiene la instancia del contrato para interactuar
 */
export async function getGameContract() {
  if (!signer) {
    await connectWallet();
  }
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Envía la puntuación al contrato validando el Proof of Personhood de World ID
 * @param {number} score Puntuación a enviar
 * @param {Object} proofDetails Detalles de la prueba devueltos por IDKit
 */
export async function submitScoreToContract(score, proofDetails) {
  try {
    const contract = await getGameContract();
    
    // Desestructurar detalles de World ID
    const { merkle_root, nullifier_hash, proof } = proofDetails;
    
    // Convertir a formatos esperados por el contrato inteligente (Uint256)
    // El ABI asume un arreglo de 8 uint256 para la prueba
    const formattedProof = decodeWorldIdProof(proof);
    
    // Llamar a la función del contrato
    const tx = await contract.submitScore(
      score,
      merkle_root,
      nullifier_hash,
      formattedProof
    );
    
    // Esperar confirmación
    const receipt = await tx.wait();
    console.log("Transacción exitosa:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error interactuando con el contrato:", error);
    throw error;
  }
}

/**
 * Helper para decodificar el array de pruebas de World ID
 * Convierte el string empaquetado devuelto por IDKit a un arreglo de 8 uint256 (BigInts)
 * necesario para los contratos de Solidity
 */
function decodeWorldIdProof(proofString) {
  // En una implementación real con viem/ethers se suele usar abi.decode o similar
  // Asumiremos que el frontend importó 'ethers' y usamos AbiCoder
  const coder = AbiCoder.defaultAbiCoder();
  // El proof devuelto por World ID suele ser un uint256[8] codificado
  return coder.decode(["uint256[8]"], proofString)[0];
}

export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function onAccountsChanged(callback) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
}
