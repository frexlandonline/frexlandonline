const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');
const fs = require('fs');

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xd4cd171e3b1b6e4b9fedc25cdbf7a4c9d2a243e38a77b90fc2a0dfee05ac7f4d';

const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TetrisAavePrizePool.sol/TetrisAavePrizePool.json', 'utf8'));

const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

async function main() {
  console.log("Deploying contract to Base Mainnet...");
  console.log("Using account:", account.address);
  
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("ETH Balance:", Number(balance) / 1e18, "ETH");

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log("Deploy Tx Hash:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;
  console.log("Deployed contract at:", contractAddress);

  console.log("Initializing...");
  const initHash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'initialize',
    args: [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // usdc en Base Mainnet
      "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB", // aUSDC (aBasUSDC) en Base Mainnet
      "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", // Aave Pool en Base Mainnet
      3600 // 1 hora de cooldown por defecto
    ]
  });

  console.log("Init Tx Hash:", initHash);
  await publicClient.waitForTransactionReceipt({ hash: initHash });
  console.log("Initialization successful.");
  console.log("DONE. Please update src/web3/contract.ts with the new address:", contractAddress);
}

main().catch(console.error);
