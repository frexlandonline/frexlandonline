const fs = require('fs');
const path = require('path');

// 1. Update walletModal.js
const walletModalPath = path.join(__dirname, 'src/components/walletModal.js');
let walletModal = fs.readFileSync(walletModalPath, 'utf8');

if (!walletModal.includes('connectWallet')) {
  walletModal = `import { connectWallet } from '../web3/wallet.ts';\n` + walletModal;
  
  walletModal = walletModal.replace(
    /onConnect\(address, name, chain, message, signature\);/,
    `if (chain === 'ethereum') {
            try {
              await connectWallet();
            } catch (e) {
              console.warn('Error syncing Wagmi:', e);
            }
          }
          onConnect(address, name, chain, message, signature);`
  );
  fs.writeFileSync(walletModalPath, walletModal);
  console.log('Updated walletModal.js');
}

// 2. Update wallet.js
const walletJsPath = path.join(__dirname, 'src/views/wallet.js');
let walletJs = fs.readFileSync(walletJsPath, 'utf8');

// Remove World ID block
const worldIdRegex = /<!-- SECCIÓN WORLD ID & HUMANIDAD \(EVM only\) -->[\s\S]*?` : ''}/;
walletJs = walletJs.replace(worldIdRegex, '<!-- SECCIÓN WORLD ID REMOVIDA -->');

// Remove Saldo Depositado y Creditos block
const balancesGridRegex = /<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">[\s\S]*?<\/div>\s*<\/div>/;
walletJs = walletJs.replace(balancesGridRegex, '');

fs.writeFileSync(walletJsPath, walletJs);
console.log('Updated wallet.js');
