const fs = require('fs');
const path = require('path');

// 1. Fix getTransactionHistory in contract.ts
const contractTsPath = path.join(__dirname, 'src/web3/contract.ts');
let contractTs = fs.readFileSync(contractTsPath, 'utf8');

contractTs = contractTs.replace(
  /const fromBlock = 10000000n; \/\/ approximate safe block on base sepolia/,
  `const currentBlock = await publicClient.getBlockNumber();\n    const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;`
);

fs.writeFileSync(contractTsPath, contractTs);
console.log('Fixed fromBlock in contract.ts');

// 2. Modify TetrisAavePrizePool.sol to bypass Aave
const solPath = path.join(__dirname, 'contracts/TetrisAavePrizePool.sol');
let sol = fs.readFileSync(solPath, 'utf8');

sol = sol.replace(/usdc\.forceApprove\(address\(aavePool\), _monto\);\s*aavePool\.supply\(address\(usdc\), _monto, address\(this\), 0\);/g, `// usdc.forceApprove(address(aavePool), _monto);\n        // aavePool.supply(address(usdc), _monto, address(this), 0);`);

sol = sol.replace(/aavePool\.withdraw\(address\(usdc\), _monto, msg\.sender\);/g, `// aavePool.withdraw(address(usdc), _monto, msg.sender);\n        usdc.safeTransfer(msg.sender, _monto);`);

sol = sol.replace(/aavePool\.withdraw\(address\(usdc\), interesGenerado, address\(this\)\);/g, `// aavePool.withdraw(address(usdc), interesGenerado, address(this));`);

fs.writeFileSync(solPath, sol);
console.log('Modified TetrisAavePrizePool.sol to bypass Aave calls');
