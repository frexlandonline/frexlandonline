const { createWalletClient, createPublicClient, http, encodeFunctionData } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');

const PRIVATE_KEY = '0xd4cd171e3b1b6e4b9fedc25cdbf7a4c9d2a243e38a77b90fc2a0dfee05ac7f4d';

const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TetrisAavePrizePool.sol/TetrisAavePrizePool.json', 'utf8'));

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org")
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http("https://sepolia.base.org")
});

async function main() {
  console.log("Deploying fresh standalone contract...");
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;
  console.log("Deployed fresh contract at:", contractAddress);

  console.log("Initializing...");
  const initHash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'initialize',
    args: [
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // usdc
      "0x0000000000000000000000000000000000000000", // aUSDC
      "0x0000000000000000000000000000000000000000", // aavePool
      1 // 1 sec cooldown
    ]
  });

  await publicClient.waitForTransactionReceipt({ hash: initHash });
  console.log("Initialized successfully!");

  // Update contract.ts
  const tsPath = './src/web3/contract.ts';
  let ts = fs.readFileSync(tsPath, 'utf8');
  ts = ts.replace(/export const CONTRACT_ADDRESS = '0x[a-fA-F0-9]+';/, `export const CONTRACT_ADDRESS = '${contractAddress}';`);
  fs.writeFileSync(tsPath, ts);
  console.log("Updated contract.ts");
}

main().catch(console.error);
