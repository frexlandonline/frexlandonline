const fs = require('fs');
const path = require('path');

const hhPath = path.join(__dirname, 'hardhat.config.js');
let hh = fs.readFileSync(hhPath, 'utf8');

hh = hh.replace(/type: "http",\n\s*/g, "");
fs.writeFileSync(hhPath, hh);
console.log('Fixed hardhat config');
