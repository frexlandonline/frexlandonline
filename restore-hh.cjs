const fs = require('fs');
const path = require('path');

const hhPath = path.join(__dirname, 'hardhat.config.js');
let hh = fs.readFileSync(hhPath, 'utf8');

hh = hh.replace(/baseSepolia: \{/, "baseSepolia: {\n      type: \"http\",");
hh = hh.replace(/baseMainnet: \{/, "baseMainnet: {\n      type: \"http\",");

fs.writeFileSync(hhPath, hh);
console.log('Restored hardhat config');
