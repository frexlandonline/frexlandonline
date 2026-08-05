const fs = require('fs');
const path = require('path');

// 1. Fix double UI in wallet.js
const walletJsPath = path.join(__dirname, 'src/views/wallet.js');
let walletJs = fs.readFileSync(walletJsPath, 'utf8');

const regexDoubleUI = /<div style="background: rgba\(255,255,255,0\.02\); padding: 12px; border-radius: var\(--radius-sm\); border: 1px solid var\(--border-color\);">\s*<span style="font-size: 0\.75rem; color: var\(--text-muted\);">Créditos Disponibles<\/span>\s*<div style="font-size: 1\.2rem; font-weight: bold; margin-top: 4px; color: var\(--neon-green\);">\s*🪙 \$\{currentUser\?\.creditos_escritura \|\| 0\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">/;

walletJs = walletJs.replace(regexDoubleUI, `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">`);
fs.writeFileSync(walletJsPath, walletJs);
console.log('Fixed double UI in wallet.js');

// 2. Fix Infinite Approval and Deposit Error reporting in contract.ts
const contractTsPath = path.join(__dirname, 'src/web3/contract.ts');
let contractTs = fs.readFileSync(contractTsPath, 'utf8');

if (!contractTs.includes('maxUint256')) {
  contractTs = contractTs.replace(/import \{ createPublicClient, createWalletClient, custom, http, fallback \} from 'viem';/, 
    `import { createPublicClient, createWalletClient, custom, http, fallback, maxUint256 } from 'viem';`);
}

// modify approveUSDC
contractTs = contractTs.replace(/args: \[CONTRACT_ADDRESS, amount\],/g, `args: [CONTRACT_ADDRESS, maxUint256],`);

// modify depositUSDC to catch detailed error
const depositUSDCRegex = /export async function depositUSDC\(amount: bigint\): Promise<`0x\$\{string\}`> \{[\s\S]*?functionName: 'registrarEntrada',[\s\S]*?\}\);/m;

const depositUSDCMatch = contractTs.match(depositUSDCRegex);
if (depositUSDCMatch) {
  let newDeposit = depositUSDCMatch[0].replace(
    /const \{ request \} = await getPublicClient\(\)\.simulateContract\(\{/,
    `let request;\n  try {\n    const sim = await getPublicClient().simulateContract({`
  );
  newDeposit = newDeposit.replace(/\}\);/, `});\n    request = sim.request;\n  } catch(e: any) {\n    console.error('Simulate reverted:', e);\n    throw new Error('El deposito fallo en la simulacion del contrato: ' + (e.shortMessage || e.message));\n  }`);
  contractTs = contractTs.replace(depositUSDCRegex, newDeposit);
}

fs.writeFileSync(contractTsPath, contractTs);
console.log('Updated contract.ts (Infinite Approval & Error Handling)');

// 3. Auto-reconnect in wallet.ts
const walletTsPath = path.join(__dirname, 'src/web3/wallet.ts');
let walletTs = fs.readFileSync(walletTsPath, 'utf8');

if (!walletTs.includes('reconnect(config)')) {
  walletTs = walletTs.replace(/import \{ connect, disconnect, getAccount, watchAccount, switchChain \} from '@wagmi\/core';/, 
    `import { connect, disconnect, getAccount, watchAccount, switchChain, reconnect } from '@wagmi/core';`);
  
  walletTs += `\n// Auto-reconnect Wagmi session\ntry {\n  reconnect(config);\n} catch(e) {}\n`;
  fs.writeFileSync(walletTsPath, walletTs);
  console.log('Added auto-reconnect to wallet.ts');
}

