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

  console.log("Desplegando contratos en Base Mainnet con la cuenta:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance de la cuenta:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ ERROR: No tienes fondos (ETH) en Base Mainnet para pagar el gas del despliegue.");
    process.exit(1);
  }

  // Direcciones Base Mainnet
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const aUsdcAddress = "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB"; 
  const aavePoolAddress = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
  const tiempoBloqueoRetiro = 5; // 5 segundos de cooldown

  console.log("Leyendo artefactos compilados...");
  const logicArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TetrisAavePrizePool.sol/TetrisAavePrizePool.json', 'utf8'));
  const proxyArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TetrisAaveProxy.sol/TetrisAaveProxy.json', 'utf8'));

  // 1. Deploy Logic (Implementation)
  console.log("1. Iniciando despliegue de la Lógica (Implementación)...");
  const logicFactory = new ethers.ContractFactory(logicArtifact.abi, logicArtifact.bytecode, wallet);
  const logicContract = await logicFactory.deploy();
  await logicContract.waitForDeployment();
  const logicAddress = await logicContract.getAddress();
  console.log("Implementación desplegada en:", logicAddress);
  
  console.log("Esperando 10 segundos para que el RPC de Base sincronice el código...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 2. Encode Initialize Data
  console.log("2. Codificando datos de inicialización...");
  const iface = new ethers.Interface(logicArtifact.abi);
  const initData = iface.encodeFunctionData("initialize", [usdcAddress, aUsdcAddress, aavePoolAddress, tiempoBloqueoRetiro]);

  // 3. Deploy Proxy
  console.log("3. Iniciando despliegue del Proxy UUPS...");
  const proxyFactory = new ethers.ContractFactory(proxyArtifact.abi, proxyArtifact.bytecode, wallet);
  const proxyContract = await proxyFactory.deploy(logicAddress, initData);
  await proxyContract.waitForDeployment();
  
  const proxyAddress = await proxyContract.getAddress();
  console.log("=========================================");
  console.log("✅ TetrisAavePrizePool PROXY desplegado en Base Mainnet en:", proxyAddress);
  console.log("=========================================");
}

main().catch(console.error);
