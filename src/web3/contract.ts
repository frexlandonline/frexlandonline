import { createPublicClient, createWalletClient, custom, http, decodeAbiParameters, parseAbiParameters, maxUint256 } from 'viem';
import { base } from 'viem/chains';
import { getConnectedAddress, ensureBaseMainnet } from './wallet.js';

// CONTRATO SEGURO DESPLEGADO EL 06-AGO-2026
export const CONTRACT_ADDRESS = '0xa129A50c3303057eC25780da0f645a977Bbf66bb';

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "usuario",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "monto",
        "type": "uint256"
      }
    ],
    "name": "EntradaRegistrada",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interesGenerado",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "ganadores",
        "type": "address[]"
      }
    ],
    "name": "PremiosDistribuidos",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "usuario",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "monto",
        "type": "uint256"
      }
    ],
    "name": "RetiroCapital",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nuevoTiempo",
        "type": "uint256"
      }
    ],
    "name": "TiempoBloqueoActualizado",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "aUSDC",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "aavePool",
    "outputs": [
      {
        "internalType": "contract IPool",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "ganadores",
        "type": "address[]"
      }
    ],
    "name": "distribuirPremiosTorneo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdc",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_aUSDC",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_aavePool",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_tiempoBloqueoRetiro",
        "type": "uint256"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_monto",
        "type": "uint256"
      }
    ],
    "name": "registrarEntrada",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_monto",
        "type": "uint256"
      }
    ],
    "name": "retirarCapitalParcial",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "saldosUsuarios",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_nuevoTiempo",
        "type": "uint256"
      }
    ],
    "name": "setTiempoBloqueoRetiro",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tiempoBloqueoRetiro",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCapitalDepositado",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ultimaDistribucion",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "ultimoAccionar",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ABI mínimo para el token ERC20 de recompensas
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'external',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http()
  });
}

// USDC contract addresses per chain
const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',     // Ethereum Mainnet
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // Optimism
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',   // Polygon
  480: '0x79A02482A880bCE3B13f5c8ee16E10C694b5e3f9',   // World Chain
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
};

const RPC_URLS: Record<number, string> = {
  1: 'https://cloudflare-eth.com',
  10: 'https://mainnet.optimism.io',
  137: 'https://polygon-rpc.com',
  480: 'https://worldchain-mainnet.g.alchemy.com/public',
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc'
};

/**
 * Fetches the USDC balance for an address on a given chain.
 * Returns formatted balance string (USDC has 6 decimals).
 */
export async function getUSDCBalance(address: `0x${string}`, chainId: number): Promise<string> {
  const usdcAddress = USDC_ADDRESSES[chainId];
  const rpcUrl = RPC_URLS[chainId];
  if (!usdcAddress || !rpcUrl) return '0.00';

  try {
    // Build a public client for the specific chain
    const client = createPublicClient({
      transport: http(rpcUrl)
    });
    
    const balance = await client.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address]
    });
    // USDC has 6 decimals
    const formatted = Number(balance) / 1e6;
    return formatted.toFixed(2);
  } catch (err) {
    console.error('Error fetching USDC balance:', err);
    return '0.00';
  }
}

export function getWalletClient() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('Proveedor Web3 no disponible. Por favor instala MetaMask.');
  return createWalletClient({
    chain: base,
    transport: custom(ethereum)
  });
}

/**
 * Decodifica la prueba de World ID de formato hexadecimal a un arreglo de 8 uint256 (bigint)
 */
function decodeWorldIdProof(proofHex: string): readonly bigint[] {
  try {
    // Si la prueba viene sin el prefijo '0x', lo agregamos
    const formattedHex = proofHex.startsWith('0x') ? proofHex : `0x${proofHex}`;
    const decoded = decodeAbiParameters(
      parseAbiParameters('uint256[8]'),
      formattedHex as `0x${string}`
    );
    return decoded[0];
  } catch (error) {
    console.error("Error decodificando la prueba de World ID:", error);
    throw new Error("Formato de prueba inválido. Asegúrese de que sea un string hexadecimal válido.");
  }
}

/**
 * Envía el puntaje máximo a la blockchain validando la prueba de World ID.
 */
export async function submitScoreToBlockchain(
  score: number,
  proofDetails: { merkle_root: string; nullifier_hash: string; proof: string }
): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const publicClient = getPublicClient();
  const walletClient = getWalletClient();

  const root = BigInt(proofDetails.merkle_root);
  const nullifierHash = BigInt(proofDetails.nullifier_hash);
  const proof = decodeWorldIdProof(proofDetails.proof);

  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'submitScore',
    args: [BigInt(score), root, nullifierHash, proof as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]],
    account: address
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

/**
 * Realiza un depósito de tokens de recompensa en el contrato.
 */
export async function depositTokens(amount: bigint): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const publicClient = getPublicClient();
  const walletClient = getWalletClient();

  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'deposit',
    args: [amount],
    account: address
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

/**
 * Obtiene el puntaje máximo guardado en cadena de una dirección.
 */
export async function getHighScoreFromChain(playerAddress: string): Promise<number> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return 0;
  try {
    const publicClient = getPublicClient();
    const score = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'highScores',
      args: [playerAddress as `0x${string}`]
    });
    return Number(score);
  } catch (error) {
    console.error("Error al leer el High Score del contrato:", error);
    return 0;
  }
}

/**
 * Verifica si una billetera ha sido validada como humana en el contrato.
 */
export async function checkVerificationOnChain(playerAddress: string): Promise<boolean> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return false;
  try {
    const publicClient = getPublicClient();
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'isVerified',
      args: [playerAddress as `0x${string}`]
    }) as boolean;
  } catch (error) {
    console.error("Error al verificar humanidad en el contrato:", error);
    return false;
  }
}

/**
 * Obtiene la dirección del token de recompensas.
 */
export async function getRewardTokenAddress(): Promise<`0x${string}`> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return '0x0000000000000000000000000000000000000000';
  const publicClient = getPublicClient();
  return await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'rewardToken'
  }) as `0x${string}`;
}

/**
 * Obtiene el balance de tokens de recompensa de un usuario.
 */
export async function getRewardTokenBalance(playerAddress: string): Promise<bigint> {
  try {
    const tokenAddress = await getRewardTokenAddress();
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return 0n;

    const publicClient = getPublicClient();
    return await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [playerAddress as `0x${string}`]
    }) as bigint;
  } catch (error) {
    console.error("Error al obtener balance de tokens:", error);
    return 0n;
  }
}

/**
 * Aprueba al contrato de recompensas para gastar los tokens del usuario.
 */
export async function approveRewardToken(amount: bigint): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const tokenAddress = await getRewardTokenAddress();
  if (tokenAddress === '0x0000000000000000000000000000000000000000') throw new Error('Token de recompensa no configurado');

  const publicClient = getPublicClient();
  const walletClient = getWalletClient();

  const { request } = await publicClient.simulateContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESS, maxUint256],
    account: address
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

/**
 * Obtiene la asignación de tokens aprobados para el contrato.
 */
export async function getAllowance(playerAddress: string): Promise<bigint> {
  try {
    const tokenAddress = await getRewardTokenAddress();
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return 0n;

    const publicClient = getPublicClient();
    return await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [playerAddress as `0x${string}`, CONTRACT_ADDRESS]
    }) as bigint;
  } catch (error) {
    console.error("Error al obtener allowance de tokens:", error);
    return 0n;
  }
}

/**
 * Obtiene el balance total de la pool de premios (staking pool)
 */
export async function getStakingPoolBalance(): Promise<bigint> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    // Si no está deployado aún, retornamos un mock representativo (ej: 1250 WLD)
    return 1250000000000000000000n; // 1250 WLD
  }
  try {
    const publicClient = getPublicClient();
    // Consultamos el balance nativo del contrato de staking
    const balance = await publicClient.getBalance({ address: CONTRACT_ADDRESS });
    return balance;
  } catch (error) {
    console.error("Error al obtener balance de la pool de staking:", error);
    return 1250000000000000000000n; // fallback mock
  }
}

/**
 * Verifica si el contrato tiene allowance de USDC.
 */
export async function checkUSDCAllowance(owner: string, amount: bigint): Promise<boolean> {
  const allowance = await getPublicClient().readContract({
    address: USDC_ADDRESSES[8453],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner as `0x${string}`, CONTRACT_ADDRESS]
  }) as bigint;
  return allowance >= amount;
}

/**
 * Aprueba USDC al contrato.
 */
export async function approveUSDC(amount: bigint): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const { request } = await getPublicClient().simulateContract({
    address: USDC_ADDRESSES[8453],
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESS, maxUint256],
    account: address
  });

  const txHash = await getWalletClient().writeContract(request);
  await getPublicClient().waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Deposita USDC llamando a registrarEntrada
 */
export async function depositUSDC(amount: bigint): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  let request;
  try {
    const sim = await getPublicClient().simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registrarEntrada',
    args: [amount],
    account: address
  });
    request = sim.request;
  } catch(e: any) {
    console.error('Simulate reverted:', e);
    throw new Error('El deposito fallo en la simulacion del contrato: ' + (e.shortMessage || e.message));
  }

  const txHash = await getWalletClient().writeContract(request);
  await getPublicClient().waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Retira USDC llamando a retirarCapitalParcial
 */
export async function withdrawUSDC(amount: bigint): Promise<`0x${string}`> {
  await ensureBaseMainnet();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const { request } = await getPublicClient().simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'retirarCapitalParcial',
    args: [amount],
    account: address
  });

  const txHash = await getWalletClient().writeContract(request);
  await getPublicClient().waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Obtiene el historial de transacciones del usuario.
 */
export async function getTransactionHistory(address: string): Promise<any[]> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return [];
  const publicClient = getPublicClient();
  
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const CHUNK_SIZE = 9999n;
    const MAX_LOOKBACK = 150000n; // ~3.5 days on Base
    const targetBlock = currentBlock - MAX_LOOKBACK > 0n ? currentBlock - MAX_LOOKBACK : 0n;

    let allDeposits: any[] = [];
    let allWithdrawals: any[] = [];
    
    // Batch fetch function
    const fetchBatch = async (startBlock: bigint, endBlock: bigint) => {
      const deposits = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'EntradaRegistrada',
          inputs: [
            { indexed: true, name: 'usuario', type: 'address' },
            { indexed: false, name: 'monto', type: 'uint256' }
          ]
        },
        args: { usuario: address as `0x${string}` },
        fromBlock: startBlock,
        toBlock: endBlock
      });

      const withdrawals = await publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'RetiroCapital',
          inputs: [
            { indexed: true, name: 'usuario', type: 'address' },
            { indexed: false, name: 'monto', type: 'uint256' }
          ]
        },
        args: { usuario: address as `0x${string}` },
        fromBlock: startBlock,
        toBlock: endBlock
      });
      return { deposits, withdrawals };
    };

    // Fetch sequentially to avoid rate limiting
    for (let to = currentBlock; to > targetBlock; to -= CHUNK_SIZE) {
      let from = to - CHUNK_SIZE + 1n;
      if (from < targetBlock) from = targetBlock;
      
      try {
        const { deposits, withdrawals } = await fetchBatch(from, to);
        allDeposits = allDeposits.concat(deposits);
        allWithdrawals = allWithdrawals.concat(withdrawals);
        
        // Pequeña pausa para no saturar el nodo público
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.warn(`Error obteniendo logs del bloque ${from} al ${to}:`, err);
        // Continuamos intentando con los siguientes bloques
      }
    }

    const history = [];

    const now = Date.now();
    
    // Estimate timestamp based on block number (Base = ~2s per block)
    const getEstimatedTimestamp = (blockNum: number) => {
      const diffBlocks = Number(currentBlock) - blockNum;
      return now - (diffBlocks * 2000);
    };

    for (const log of allDeposits) {
      history.push({
        type: 'Depósito',
        amount: Number(log.args.monto) / 1e6,
        hash: log.transactionHash,
        timestamp: getEstimatedTimestamp(Number(log.blockNumber)),
        blockNumber: Number(log.blockNumber)
      });
    }

    for (const log of allWithdrawals) {
      history.push({
        type: 'Retiro',
        amount: Number(log.args.monto) / 1e6,
        hash: log.transactionHash,
        timestamp: getEstimatedTimestamp(Number(log.blockNumber)),
        blockNumber: Number(log.blockNumber)
      });
    }

    history.sort((a, b) => b.blockNumber - a.blockNumber);

    return history;
  } catch (error) {
    console.error("Error al obtener historial de transacciones:", error);
    return [];
  }
}

export async function getUserDepositedBalance(playerAddress: string): Promise<number> {
  try {
    const publicClient = getPublicClient();
    const balanceRaw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'saldosUsuarios',
      args: [playerAddress as `0x${string}`]
    });
    return Number(balanceRaw) / 1e6;
  } catch (err) {
    console.error("Error reading saldosUsuarios:", err);
    return 0;
  }
}

export async function getAaveFinancialData() {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return { totalDeposited: 0, currentBalance: 0, interest: 0 };
  try {
    const client = createPublicClient({ chain: base, transport: http() });
    const totalDepositedRaw = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'totalCapitalDepositado'
    });

    const aUSDCAddress = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';
    const aUSDC_ABI = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }];

    const currentBalanceRaw = await client.readContract({
      address: aUSDCAddress,
      abi: aUSDC_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESS]
    });

    const totalDeposited = Number(totalDepositedRaw) / 1e6;
    const currentBalance = Number(currentBalanceRaw) / 1e6;
    const interest = Math.max(0, currentBalance - totalDeposited);

    return { totalDeposited, currentBalance, interest };
  } catch (error) {
    console.error('Error fetching Aave data:', error);
    return { totalDeposited: 0, currentBalance: 0, interest: 0 };
  }
}
