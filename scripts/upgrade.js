import hre from 'hardhat';

async function main() {
  const PROXY_ADDRESS = '0xb3d5cC6695ec36c9D9F9196889BbA9C5e681F847';
  
  console.log('Upgrading TetrisAavePrizePool at proxy:', PROXY_ADDRESS);
  const TetrisAavePrizePool = await hre.ethers.getContractFactory('TetrisAavePrizePool');
  
  const upgraded = await hre.upgrades.upgradeProxy(PROXY_ADDRESS, TetrisAavePrizePool);
  await upgraded.waitForDeployment();
  
  console.log('TetrisAavePrizePool upgraded successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
