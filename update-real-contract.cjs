const fs = require('fs');
const path = require('path');

// 1. Update contract.ts
const contractTsPath = path.join(__dirname, 'src/web3/contract.ts');
let contractTs = fs.readFileSync(contractTsPath, 'utf8');

// Add 84532 to USDC_ADDRESSES
contractTs = contractTs.replace(
  /8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  \/\/ Base/,
  `8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base\n  84532: '0x036cbd53842c5426634e7929541ec2318f3dcf7e', // Base Sepolia`
);

// Add 84532 to RPC_URLS
contractTs = contractTs.replace(
  /8453: 'https:\/\/mainnet\.base\.org',/,
  `8453: 'https://mainnet.base.org',\n  84532: 'https://sepolia.base.org',`
);

// Add the deposit/withdraw/approve functions
const newFunctions = `
/**
 * Verifica si el contrato tiene allowance de USDC.
 */
export async function checkUSDCAllowance(owner: string, amount: bigint): Promise<boolean> {
  const allowance = await getPublicClient().readContract({
    address: USDC_ADDRESSES[84532],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner as \`0x\${string}\`, CONTRACT_ADDRESS]
  }) as bigint;
  return allowance >= amount;
}

/**
 * Aprueba USDC al contrato.
 */
export async function approveUSDC(amount: bigint): Promise<\`0x\${string}\`> {
  await ensurebaseSepolia();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const { request } = await getPublicClient().simulateContract({
    address: USDC_ADDRESSES[84532],
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESS, amount],
    account: address
  });

  const txHash = await getWalletClient().writeContract(request);
  await getPublicClient().waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Deposita USDC llamando a registrarEntrada
 */
export async function depositUSDC(amount: bigint): Promise<\`0x\${string}\`> {
  await ensurebaseSepolia();
  const address = getConnectedAddress();
  if (!address) throw new Error('Billetera no conectada');

  const { request } = await getPublicClient().simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registrarEntrada',
    args: [amount],
    account: address
  });

  const txHash = await getWalletClient().writeContract(request);
  await getPublicClient().waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Retira USDC llamando a retirarCapitalParcial
 */
export async function withdrawUSDC(amount: bigint): Promise<\`0x\${string}\`> {
  await ensurebaseSepolia();
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
`;

contractTs = contractTs + newFunctions;
fs.writeFileSync(contractTsPath, contractTs);
console.log('Updated contract.ts');
