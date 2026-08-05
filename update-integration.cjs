const fs = require('fs');
const path = require('path');

const newAddress = '0xb3d5cC6695ec36c9D9F9196889BbA9C5e681F847';
const chainId = 84532;
const chainName = 'Base Sepolia';

// 1. Get ABI
const artifactPath = path.join(__dirname, 'artifacts/contracts/TetrisAavePrizePool.sol/TetrisAavePrizePool.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const abiStr = JSON.stringify(artifact.abi, null, 2);

// 2. Update src/web3/contract.ts
const contractTsPath = path.join(__dirname, 'src/web3/contract.ts');
let contractTs = fs.readFileSync(contractTsPath, 'utf8');

// Replace address
contractTs = contractTs.replace(
  /export const CONTRACT_ADDRESS = '[^']+';/,
  `export const CONTRACT_ADDRESS = '${newAddress}';`
);

// Replace ABI
contractTs = contractTs.replace(
  /export const CONTRACT_ABI = \[[\s\S]*?\] as const;/,
  `export const CONTRACT_ABI = ${abiStr} as const;`
);

// Replace worldChain with baseSepolia
contractTs = contractTs.replace(/import \{ worldChain \} from '\.\/config\.js';/, "import { baseSepolia } from 'viem/chains';");
contractTs = contractTs.replace(/chain: worldChain/g, "chain: baseSepolia");

fs.writeFileSync(contractTsPath, contractTs);
console.log('Updated src/web3/contract.ts');

// 3. Update src/web3/config.ts
const configTsPath = path.join(__dirname, 'src/web3/config.ts');
const newConfig = `import { createConfig, http, injected } from '@wagmi/core';
import { baseSepolia } from 'viem/chains';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
  },
});
`;
fs.writeFileSync(configTsPath, newConfig);
console.log('Updated src/web3/config.ts');

// 4. Update src/views/wallet.js
const walletJsPath = path.join(__dirname, 'src/views/wallet.js');
let walletJs = fs.readFileSync(walletJsPath, 'utf8');
walletJs = walletJs.replace(/480/g, '84532');
walletJs = walletJs.replace(/World Chain L2/g, 'Base Sepolia');
walletJs = walletJs.replace(/World Chain/g, 'Base Sepolia');
fs.writeFileSync(walletJsPath, walletJs);
console.log('Updated src/views/wallet.js');

// 5. Update src/views/play.js
const playJsPath = path.join(__dirname, 'src/views/play.js');
let playJs = fs.readFileSync(playJsPath, 'utf8');
playJs = playJs.replace(/480/g, '84532');
playJs = playJs.replace(/World Chain/g, 'Base Sepolia');
fs.writeFileSync(playJsPath, playJs);
console.log('Updated src/views/play.js');

console.log('All updates successful.');
