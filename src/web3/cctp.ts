import { encodeFunctionData } from 'viem';
import { sendWorldTransaction } from './world.ts';
import api from '../services/api.js';

const TOKEN_MESSENGER_V2 = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d';
const USDC_WORLD_CHAIN = '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1';
const DOMAIN_BASE = 6;

// ABIs básicos para CCTP
const erc20Abi = [
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

const tokenMessengerAbi = [
  {
    "inputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "destinationDomain", "type": "uint32" },
      { "name": "mintRecipient", "type": "bytes32" },
      { "name": "burnToken", "type": "address" }
    ],
    "name": "depositForBurn",
    "outputs": [{ "name": "_nonce", "type": "uint64" }],
    "type": "function"
  }
];

/**
 * Función auxiliar para convertir una dirección a bytes32
 */
function addressToBytes32(address: string): string {
  return '0x' + address.replace('0x', '').padStart(64, '0');
}

/**
 * Realiza el burn de USDC en World Chain usando CCTP a través de MiniKit.
 * Retorna el transaction hash.
 */
export async function burnOnWorldChain(amountWei: bigint, recipientAddress: string): Promise<string> {
  const recipientBytes32 = addressToBytes32(recipientAddress);

  // Payload para approve
  const approveData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [TOKEN_MESSENGER_V2, amountWei],
  });

  // Payload para depositForBurn
  const burnData = encodeFunctionData({
    abi: tokenMessengerAbi,
    functionName: 'depositForBurn',
    args: [amountWei, DOMAIN_BASE, recipientBytes32, USDC_WORLD_CHAIN],
  });

  // MiniKit puede procesar múltiples llamadas en una sola transacción si la app lo permite
  // Si no, se manda secuencial (pero usualmente MiniKit soporta batches/Permit2)
  const txPayload = {
    chainId: 480,
    reference: `cctp-${Date.now()}`.slice(0, 32),
    transactions: [
      {
        to: USDC_WORLD_CHAIN,
        data: approveData,
        value: "0x0"
      },
      {
        to: TOKEN_MESSENGER_V2,
        data: burnData,
        value: "0x0"
      }
    ]
  };

  const response = await sendWorldTransaction(txPayload);
  const txId = response?.transactionId || 
               response?.userOpHash || 
               response?.finalPayload?.transaction_id || 
               response?.finalPayload?.userOpHash ||
               response?.data?.transaction_id ||
               response?.data?.userOpHash;

  if (txId || response?.status === 'success') {
    return txId || '0x' + Date.now();
  }
  throw new Error("Transacción cancelada o fallida en World App");
}

/**
 * Orquesta el flujo completo del bridge desde el frontend.
 * 1. Quema en World Chain.
 * 2. Llama al backend para esperar attestation, acuñar en Base y depositar en Aave.
 */
export async function bridgeUSDCToBase(amountWei: bigint, address: string, onProgress: (step: string) => void): Promise<void> {
  // 1. Quema en World Chain
  onProgress("Aprobando y quemando USDC en World Chain...");
  const txHash = await burnOnWorldChain(amountWei, address);
  
  // 2. Relay al backend para completar el flujo
  onProgress("Esperando confirmación de Circle (puede demorar ~20s)...");
  
  try {
    // Esto llamará a la ruta /api/wallet/bridge-world-to-base
    // que se encargará del attestation y mint en Base
    const result = await api.post('/wallet/bridge-world-to-base', {
      burnTxHash: txHash,
      amount: Number(amountWei) / 1e6 // Guardar en formato normal para el backend
    });
    
    if (result.error) throw new Error(result.error);
    
    onProgress("Depósito completado exitosamente.");
  } catch (error: any) {
    throw new Error(`El bridge falló en el servidor: ${error.message}`);
  }
}
