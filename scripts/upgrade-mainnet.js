import fs from 'fs';
import { ethers } from 'ethers';
import 'dotenv/config';

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: No se encontró PRIVATE_KEY en el archivo .env");
    process.exit(1);
  }

  const rpcUrl = process.env.BASE_MAINNET_RPC || "https://mainnet.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const PROXY_ADDRESS = "0x8bb01A4e20638A58c168a9a6745d0F62231B0b94";

  console.log("Upgrading contrato en Base Mainnet con la cuenta:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance de la cuenta:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ ERROR: No tienes fondos (ETH) en Base Mainnet para pagar el gas del despliegue.");
    process.exit(1);
  }

  console.log("Leyendo artefactos compilados de la nueva implementación...");
  const logicArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TetrisAavePrizePool.sol/TetrisAavePrizePool.json', 'utf8'));

  // 1. Deploy New Logic (Implementation)
  console.log("1. Iniciando despliegue de la NUEVA Lógica (Implementación)...");
  const logicFactory = new ethers.ContractFactory(logicArtifact.abi, logicArtifact.bytecode, wallet);
  const logicContract = await logicFactory.deploy();
  await logicContract.waitForDeployment();
  const logicAddress = await logicContract.getAddress();
  console.log("NUEVA Implementación desplegada en:", logicAddress);
  
  console.log("Esperando 5 segundos para sincronización...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 2. Upgrade Proxy
  console.log("2. Actualizando el Proxy...");
  const proxyContract = new ethers.Contract(PROXY_ADDRESS, logicArtifact.abi, wallet);
  
  // Llamamos upgradeToAndCall pasando '0x' como data porque no necesitamos reinicializar
  const tx = await proxyContract.upgradeToAndCall(logicAddress, "0x");
  await tx.wait();
  
  console.log("=========================================");
  console.log("✅ Proxy actualizado a la nueva implementación.");
  console.log("=========================================");
  
  // 3. Sweeping stuck USDC into Aave!
  console.log("3. Recuperando USDC atascado enviándolo al Pool de Aave...");
  const sweepTx = await proxyContract.supplyExistingUSDC();
  await sweepTx.wait();
  console.log("✅ Todo el USDC atascado ha sido depositado en Aave correctamente.");
}

main().catch(console.error);
