const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const proxyAddress = "0x8bb01A4e20638A58c168a9a6745d0F62231B0b94";
  const slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  
  const implRaw = await provider.getStorage(proxyAddress, slot);
  // Implementation address is the last 20 bytes (40 hex chars) of the 32-byte word
  const implAddress = "0x" + implRaw.slice(-40);
  
  console.log("IMPLEMENTATION_ADDRESS:", implAddress);
}

main().catch(console.error);
