const fs = require('fs');
const path = require('path');

const solPath = path.join(__dirname, 'contracts/TetrisAavePrizePool.sol');
let sol = fs.readFileSync(solPath, 'utf8');

sol = sol.replace(/require\(_usdc != address\(0\) && _aUSDC != address\(0\) && _aavePool != address\(0\), "Direcciones invalidas"\);/, 
  'require(_usdc != address(0), "Direcciones invalidas");');

fs.writeFileSync(solPath, sol);
console.log('Modified initialize requirements');
