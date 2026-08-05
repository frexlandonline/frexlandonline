const fs = require('fs');
const path = require('path');

const walletJsPath = path.join(__dirname, 'src/views/wallet.js');
let walletJs = fs.readFileSync(walletJsPath, 'utf8');

// 1. Update imports
walletJs = walletJs.replace(
  /getPublicClient,/,
  `getPublicClient,\n  approveUSDC,\n  depositUSDC,\n  withdrawUSDC,`
);

// 2. Replace 8453 with 84532 in conditionals
walletJs = walletJs.replace(/chainId === 8453(?!\d)/g, 'chainId === 84532');
walletJs = walletJs.replace(/chainId !== 8453(?!\d)/g, 'chainId !== 84532');

// 3. Update handleSwitchToBase
walletJs = walletJs.replace(/0x2105/g, '0x14a34');
walletJs = walletJs.replace(/mainnet\.base\.org/g, 'sepolia.base.org');
walletJs = walletJs.replace(/chainName: 'Base'/g, "chainName: 'Base Sepolia'");

// 4. Update handleDepositBase
const oldDeposit = /async function handleDepositBase\(\) \{[\s\S]*?finally \{\s*btn\.textContent = originalText;\s*btn\.disabled = false;\s*\}\s*\}/;
const newDeposit = `async function handleDepositBase() {
  const input = document.getElementById('deposit-amount');
  const amountStr = input ? input.value : '0';
  const amount = parseFloat(amountStr);

  if (!amount || amount < 10 || amount % 10 !== 0) {
    showToast('El monto mínimo es 10 USDC y debe ser múltiplo de 10.', 'error');
    return;
  }
  
  const btn = document.getElementById('btn-deposit-base');
  const originalText = btn.textContent;
  btn.textContent = 'Aprobando USDC...';
  btn.disabled = true;

  try {
    const amountWei = BigInt(amount * 1e6); // USDC has 6 decimals
    
    // 1. Approve USDC
    await approveUSDC(amountWei);
    
    btn.textContent = 'Depositando...';
    showToast('Aprobación exitosa. Ejecutando depósito en el contrato...', 'info');
    
    // 2. Deposit into Smart Contract
    await depositUSDC(amountWei);

    // 3. Update backend credits
    const result = await api.post('/wallet/deposit', { amount });
    updateLocalUser(result.user);
    
    showToast('Depósito on-chain exitoso. Créditos actualizados.', 'success');
    input.value = '';
    renderWalletContent();
  } catch (error) {
    console.error("Deposit error:", error);
    showToast(error.shortMessage || error.message || 'Falló el depósito', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}`;
walletJs = walletJs.replace(oldDeposit, newDeposit);

// 5. Update executeWithdraw
const oldWithdraw = /async function executeWithdraw\(amount\) \{[\s\S]*?btn\.disabled = false;\s*\}/;
const newWithdraw = `async function executeWithdraw(amount) {
  const btn = document.getElementById('btn-withdraw-base');
  const input = document.getElementById('withdraw-amount');
  
  btn.textContent = 'Retirando on-chain...';
  btn.disabled = true;

  try {
    const amountWei = BigInt(amount * 1e6); // 6 decimals
    
    // 1. Withdraw from Smart Contract
    await withdrawUSDC(amountWei);

    // 2. Sync backend (restar depositado)
    const result = await api.post('/wallet/withdraw', { amount });
    updateLocalUser(result.user);
    
    showToast('Retiro exitoso desde el contrato.', 'success');
    if (input) input.value = '';
    
    withdrawReady = false;
    btn.style = '';
    renderWalletContent();
  } catch (error) {
    console.error("Withdraw error:", error);
    showToast(error.shortMessage || error.message || 'Falló el retiro', 'error');
    
    withdrawReady = false;
    btn.style = '';
    btn.textContent = 'Solicitar Retiro';
    btn.disabled = false;
  }
}`;
walletJs = walletJs.replace(oldWithdraw, newWithdraw);

// Write changes
fs.writeFileSync(walletJsPath, walletJs);
console.log('Updated wallet.js');
