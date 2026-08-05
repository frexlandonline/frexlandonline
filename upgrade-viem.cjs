const { createWalletClient, createPublicClient, http, encodeFunctionData } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');

const PROXY_ADDRESS = '0xb3d5cC6695ec36c9D9F9196889BbA9C5e681F847';
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
  console.log("Deploying new implementation...");
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log("Deployment tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const newImplAddress = receipt.contractAddress;
  console.log("New implementation deployed at:", newImplAddress);

  console.log("Upgrading proxy...");
  
  // UUPS interface for upgradeToAndCall
  const uupsAbi = [{
    "inputs": [
      { "internalType": "address", "name": "newImplementation", "type": "address" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }];

  const { request } = await publicClient.simulateContract({
    account,
    address: PROXY_ADDRESS,
    abi: uupsAbi,
    functionName: 'upgradeToAndCall',
    args: [newImplAddress, "0x"],
  });

  const upgradeHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: upgradeHash });
  
  console.log("Proxy successfully upgraded!");
}

main().catch(console.error);
