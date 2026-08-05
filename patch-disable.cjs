const fs = require('fs');
const path = require('path');

const solPath = path.join(__dirname, 'contracts/TetrisAavePrizePool.sol');
let sol = fs.readFileSync(solPath, 'utf8');

sol = sol.replace(/_disableInitializers\(\);/, '// _disableInitializers();');

fs.writeFileSync(solPath, sol);
console.log('Removed _disableInitializers()');
