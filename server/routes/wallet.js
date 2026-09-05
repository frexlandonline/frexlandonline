import { Router } from 'express';
import dbAPI from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { createWalletClient, createPublicClient, http, fallback, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const baseTransport = fallback([
  http('https://base-rpc.publicnode.com'),
  http('https://mainnet.base.org'),
  http('https://1rpc.io/base')
]);

const router = Router();

// --- Check Wallet Ownership ---
router.get('/check/:address', authenticateToken, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase().trim();
    const userId = req.user.id;
    const existingUser = await dbAPI.getUserByWalletAddress(address);

    if (existingUser && String(existingUser.id) !== String(userId)) {
      return res.status(400).json({ error: 'Esta billetera ya está vinculada a otro perfil', isAvailable: false });
    }
    
    return res.json({ isAvailable: true, linkedToCurrent: existingUser ? true : false });
  } catch (error) {
    console.error('Check wallet error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Connect/Link Wallet to Active User Profile ─────────────────
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { walletAddress, chain } = req.body;
    const userId = req.user.id;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Dirección de wallet requerida' });
    }

    let selectedChain = chain;
    if (!selectedChain) {
      selectedChain = walletAddress.startsWith('0x') ? 'ethereum' : 'solana';
    }

    const normalizedAddress = walletAddress.toLowerCase().trim();

    // Check if wallet is already linked to another user
    const existingUser = await dbAPI.getUserByWalletAddress(normalizedAddress);
    if (existingUser && String(existingUser.id) !== String(userId)) {
      return res.status(400).json({ error: 'Esta billetera ya está vinculada a otro perfil' });
    }

    const user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Append wallet to the user's wallets list
    const wallets = user.wallets || {};
    wallets[selectedChain] = normalizedAddress;

    const updatedUser = await dbAPI.updateUser(userId, { wallets });

    // Exclude password hash from safe payload
    const { passwordHash, ...safeUser } = updatedUser;

    res.json({ message: 'Wallet conectada y vinculada exitosamente', user: safeUser });
  } catch (error) {
    console.error('Connect wallet error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// Helper: Puente automático de World Chain a Base y depósito en Aave
async function bridgeAndDepositToAave(amountUSDC) {
  const rawPk = process.env.PRIVATE_KEY;
  if (!rawPk) return console.error('No relayer private key');
  const pk = rawPk.startsWith('0x') ? rawPk : '0x' + rawPk;
  const account = privateKeyToAccount(pk);
  const admin = account.address;

  const worldChain = {
    id: 480,
    name: 'World Chain',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] } }
  };
  const usdcWorld = '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1';
  const usdcBase = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const CONTRACT_ADDRESS = '0xa129A50c3303057eC25780da0f645a977Bbf66bb';

  const baseClient = createPublicClient({ chain: base, transport: baseTransport });
  const baseWallet = createWalletClient({ account, chain: base, transport: baseTransport });
  const worldClient = createPublicClient({ chain: worldChain, transport: http('https://worldchain-mainnet.g.alchemy.com/public') });
  const worldWallet = createWalletClient({ account, chain: worldChain, transport: http('https://worldchain-mainnet.g.alchemy.com/public') });

  const contractAbi = parseAbi(['function registrarEntrada(uint256 _monto) external']);
  const erc20Abi = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address, address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)'
  ]);

  // Monto neto en múltiplos de 10 USDC (ej. si deposita 10.01 -> 10 USDC, 20.01 -> 20 USDC)
  const netUSDC = Math.floor(amountUSDC);
  const amountToSupply = BigInt(netUSDC) * 1000000n;
  if (amountToSupply < 10000000n) return; // Mínimo para Aave es 10 USDC

  // 1. Cotizar puente en Relay
  const quoteRes = await fetch('https://api.relay.link/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: admin,
      originChainId: 480,
      destinationChainId: 8453,
      originCurrency: usdcWorld,
      destinationCurrency: usdcBase,
      recipient: admin,
      amount: amountToSupply.toString(),
      tradeType: 'EXACT_INPUT'
    })
  });
  const quote = await quoteRes.json();
  if (!quote.steps) {
    console.error('Relay quote failed:', quote);
    return;
  }

  // 2. Ejecutar pasos en World Chain
  for (const step of quote.steps) {
    for (const item of step.items) {
      if (item.status === 'complete') continue;
      const txHash = await worldWallet.sendTransaction({
        to: item.data.to,
        data: item.data.data,
        value: BigInt(item.data.value || '0')
      });
      await worldClient.waitForTransactionReceipt({ hash: txHash });
    }
  }

  // 3. Esperar que los USDC lleguen a Base
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const bUsdc = await baseClient.readContract({ address: usdcBase, abi: erc20Abi, functionName: 'balanceOf', args: [admin] });
    if (bUsdc >= amountToSupply) break;
  }

  // 4. Asegurar allowance en Base
  const allowance = await baseClient.readContract({ address: usdcBase, abi: erc20Abi, functionName: 'allowance', args: [admin, CONTRACT_ADDRESS] });
  if (allowance < amountToSupply) {
    const approveTx = await baseWallet.writeContract({
      address: usdcBase,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, 115792089237316195423570985008687907853269984665640564039457584007913129639935n]
    });
    await baseClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // 5. Depositar en el contrato (que suministra a Aave)
  const depTx = await baseWallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: 'registrarEntrada',
    args: [amountToSupply]
  });
  await baseClient.waitForTransactionReceipt({ hash: depTx });
  console.log(`[Auto-Deposit Aave] Exitoso: ${depTx} por ${netUSDC} USDC`);
}

// ─── Deposit USDC for Credits ──────────────────────────────────
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount, platform, txHash } = req.body;
    const userId = req.user.id;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount < 10.01) {
      return res.status(400).json({ error: 'El monto mínimo de depósito es 10.01 USDC (10 USDC + 0.01 USDC para comisiones).' });
    }

    // Validar que sea estrictamente múltiplo de 10 USDC + 0.01 USDC
    const netCents = Math.round((depositAmount - 0.01) * 100);
    if (netCents < 1000 || (netCents % 1000 !== 0)) {
      return res.status(400).json({ 
        error: 'El monto a depositar debe ser múltiplo de 10 USDC sumando 0.01 USDC para comisiones (ej. 10.01, 20.01, 50.01 USDC).' 
      });
    }

    const user = await dbAPI.checkAndResetDailyCredits(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Descuento exacto: 0.01 USDC para comisiones de red y bridge
    const netAmount = Math.floor(depositAmount); // Múltiplo exacto de 10 USDC (10, 20, 30...)
    const realFee = Math.round((depositAmount - netAmount) * 100) / 100; // 0.01 USDC

    const currentTotal = user.total_depositado || 0;
    const newTotal = Math.round((currentTotal + netAmount) * 1e6) / 1e6;

    // Calcular créditos ganados: 1 crédito por cada 10 USDC netos acumulados
    const oldCreditsFromDeposit = Math.floor((currentTotal + 0.000001) / 10);
    const newCreditsFromDeposit = Math.floor((newTotal + 0.000001) / 10);
    const creditsToAdd = Math.max(0, newCreditsFromDeposit - oldCreditsFromDeposit);

    const currentCredits = user.creditos_escritura || 0;

    const updatedUser = await dbAPI.updateUser(userId, {
      creditos_escritura: currentCredits + creditsToAdd,
      total_depositado: newTotal
    });

    // Si el depósito proviene de World Chain, ejecutamos el puente y depósito en Aave en Base en segundo plano
    if (platform === 'worldchain' || req.body.platform === 'worldchain' || user.platform === 'worldchain') {
      console.log(`[WorldChain Deposit] Iniciando puente automático hacia Base y depósito en Aave de ${depositAmount} USDC en segundo plano...`);
      bridgeAndDepositToAave(depositAmount).catch(bridgeErr => {
        console.warn(`[WorldChain Deposit Warning] El puente a Aave se retrasó o falló: ${bridgeErr.message}. Los créditos del usuario ya están protegidos.`);
      });
    }

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ 
      message: `Depósito de ${depositAmount.toFixed(6)} USDC procesado. Comisión de red descontada: ${realFee.toFixed(6)} USDC. Monto neto en Aave: ${netAmount.toFixed(6)} USDC (+${creditsToAdd} créditos).`, 
      user: safeUser,
      netAmount,
      fee: realFee
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el depósito.' });
  }
});

// ─── Sync Deposit from Blockchain ──────────────────────────────────
router.post('/sync-deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ error: 'Monto inválido.' });
    }

    const user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const ADMIN_WALLETS = [
      '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
      '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
    ];
    const userWallets = (user.walletAddresses || []).concat(
      user.wallets ? Object.values(user.wallets) : []
    ).map(w => (w || '').toLowerCase());
    if (userWallets.some(w => ADMIN_WALLETS.includes(w)) || user.isAdmin || user.role === 'admin') {
      return res.json({ synced: false, message: 'Admin deposit managed manually.' });
    }

    const currentTotal = user.total_depositado || 0;
    
    // Solo actualizamos si el balance on-chain es mayor al guardado
    if (amount > currentTotal) {
      const creditsToAdd = Math.floor((amount - currentTotal) / 10);
      const currentCredits = user.creditos_escritura || 0;
      
      const updatedUser = await dbAPI.updateUser(userId, {
        creditos_escritura: currentCredits + creditsToAdd,
        total_depositado: amount
      });
      const { passwordHash, ...safeUser } = updatedUser;
      return res.json({ synced: true, user: safeUser });
    }

    return res.json({ synced: false });
  } catch (error) {
    console.error('Sync deposit error:', error);
    res.status(500).json({ error: 'Error al sincronizar depósito.' });
  }
});

// ==========================================
// Bridge World Chain -> Base (CCTP)
// ==========================================
router.post('/bridge-world-to-base', authenticateToken, async (req, res) => {
  try {
    const { burnTxHash, amount } = req.body;
    const userId = req.user.id;

    if (!burnTxHash || !amount) {
      return res.status(400).json({ error: 'Parámetros inválidos para bridge.' });
    }

    // TODO: Usar viem para consultar la API de Circle Iris
    // 1. Obtener el messageHash del evento en burnTxHash
    // 2. Hacer polling a https://iris-api.circle.com/v1/messages/{domain}/{messageHash}
    // 3. Cuando status === 'complete', obtener attestation
    // 4. Llamar a receiveMessage en Base con la private key del owner
    // 5. Llamar a registrarEntrada en TetrisAavePrizePool

    console.log(`[CCTP Bridge] Procesando tx ${burnTxHash} por ${amount} USDC...`);
    
    // Por ahora, simulamos el éxito del bridge y depósito para continuar con la lógica
    const user = await dbAPI.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const currentTotal = user.total_depositado || 0;
    const newTotal = currentTotal + amount;
    const maxCreditsNow = Math.floor(newTotal / 10);
    const newCredits = Math.max(user.creditos_escritura || 0, maxCreditsNow);

    const updatedUser = await dbAPI.updateUser(userId, {
      total_depositado: newTotal,
      creditos_escritura: newCredits
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ message: 'Bridge CCTP completado y depositado en Aave.', user: safeUser });
  } catch (error) {
    console.error('Bridge error:', error);
    res.status(500).json({ error: 'Error interno en bridge CCTP.' });
  }
});

// ==========================================
// Request Withdraw (24h lock)
// ==========================================
router.post('/request-withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido para retirar.' });
    }

    const user = await dbAPI.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const currentTotal = user.total_depositado || 0;
    if (amount > currentTotal) {
      return res.status(400).json({ error: 'No puedes retirar más del saldo que tienes depositado.' });
    }

    const updatedUser = await dbAPI.updateUser(userId, {
      withdraw_request_time: new Date().toISOString(),
      withdraw_request_amount: amount
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ message: `Solicitud de retiro de ${amount} USDC registrada.`, user: safeUser });
  } catch (error) {
    console.error('Request withdraw error:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud de retiro.' });
  }
});

// ─── Confirm Withdraw USDC ─────────────────────────────────────────────
router.post('/confirm-withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, isAdmin } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido para retirar.' });
    }

    const user = await dbAPI.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const currentTotal = user.total_depositado || 0;
    if (amount > currentTotal) {
      return res.status(400).json({ error: 'No puedes retirar más del saldo que tienes depositado.' });
    }

    // Valida las 24 horas si no es admin
    if (!isAdmin) {
      if (!user.withdraw_request_time || user.withdraw_request_amount !== amount) {
         return res.status(400).json({ error: 'Solicitud de retiro no encontrada o monto no coincide.' });
      }
      const requestTime = new Date(user.withdraw_request_time).getTime();
      const now = Date.now();
      if (now - requestTime < 24 * 60 * 60 * 1000) {
         return res.status(400).json({ error: 'Deben pasar 24 horas desde la solicitud para confirmar el retiro.' });
      }
    }

    const newTotal = Math.max(0, Math.round((currentTotal - amount) * 1e6) / 1e6);
    const maxCreditsNow = Math.floor((newTotal + 0.015) / 10);
    const humanBonus = (user.isWorldIdVerified === true) ? 1 : 0;
    const newCredits = Math.min(user.creditos_escritura || 0, maxCreditsNow + humanBonus);

    const updatedUser = await dbAPI.updateUser(userId, {
      total_depositado: newTotal,
      creditos_escritura: newCredits,
      withdraw_request_time: null,
      withdraw_request_amount: 0
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ message: `Retiro de ${amount} USDC confirmado exitosamente.`, user: safeUser });
  } catch (error) {
    console.error('Confirm withdraw error:', error);
    res.status(500).json({ error: 'Error interno del servidor al confirmar el retiro.' });
  }
});

// ==========================================
// Confirm Withdraw USDC to World Chain (Reverse Bridge)
// ==========================================
router.post('/confirm-withdraw-world', authenticateToken, async (req, res) => {
  try {
    const { amount, recipientAddress } = req.body;
    const userId = req.user.id;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Monto inválido para retirar.' });
    }

    const user = await dbAPI.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const currentTotal = user.total_depositado || 0;
    if (withdrawAmount > currentTotal) {
      return res.status(400).json({ error: 'No puedes retirar más del saldo que tienes depositado.' });
    }

    const recipient = recipientAddress || user.wallets?.worldchain || user.walletAddresses?.[0];
    if (!recipient || !recipient.startsWith('0x')) {
      return res.status(400).json({ error: 'No se encontró una dirección de World Chain vinculada para recibir los fondos.' });
    }

    console.log(`[World Chain Withdraw] Procesando retiro on-chain de ${withdrawAmount} USDC hacia ${recipient}`);

    const rawPk = process.env.PRIVATE_KEY;
    if (!rawPk) throw new Error('Relayer private key no configurada en el servidor');
    const pk = rawPk.startsWith('0x') ? rawPk : '0x' + rawPk;
    const account = privateKeyToAccount(pk);
    const admin = account.address;

    const baseClient = createPublicClient({ chain: base, transport: baseTransport });
    const baseWallet = createWalletClient({ account, chain: base, transport: baseTransport });

    const CONTRACT_ADDRESS = '0xa129A50c3303057eC25780da0f645a977Bbf66bb';
    const usdcBase = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const usdcWorld = '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1';

    const contractAbi = parseAbi([
      'function retirarCapitalParcial(uint256 _monto) external',
      'function saldosUsuarios(address) view returns (uint256)'
    ]);
    const erc20Abi = parseAbi([
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address, address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)'
    ]);
    const withdrawAmountBigInt = BigInt(Math.round(withdrawAmount * 1e6));

    // 1. Verificar balance del relayer en Base antes de retirar del contrato
    const adminBaseBalance = await baseClient.readContract({
      address: usdcBase,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [admin]
    });

    let withdrawTx = 'pre-funded';
    if (adminBaseBalance < withdrawAmountBigInt) {
      const needed = withdrawAmountBigInt - adminBaseBalance;
      const contractSaldo = await baseClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'saldosUsuarios',
        args: [admin]
      });

      if (contractSaldo < needed) {
        throw new Error(`Fondos insuficientes en el pozo para retirar (${(Number(contractSaldo) / 1e6).toFixed(2)} USDC disponibles). Contacta a soporte.`);
      }

      const toWithdraw = contractSaldo >= withdrawAmountBigInt ? withdrawAmountBigInt : needed;
      console.log(`[Withdraw] Extrayendo ${Number(toWithdraw) / 1e6} USDC de Aave en Base...`);
      withdrawTx = await baseWallet.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'retirarCapitalParcial',
        args: [toWithdraw]
      });
      await baseClient.waitForTransactionReceipt({ hash: withdrawTx });
      console.log(`[Withdraw] Confirmado retiro on-chain: ${withdrawTx}`);
    } else {
      console.log(`[Withdraw] Relayer ya cuenta con saldo suficiente en Base (${Number(adminBaseBalance) / 1e6} USDC >= ${withdrawAmount} USDC). Procediendo directo al puente.`);
    }

    // 2. Cotizar puente en Relay (usando EXACT_INPUT para que la comisión se descuente del monto retirado)
    console.log(`[Bridge] Cotizando Relay puente hacia World Chain (${recipient})...`);
    const quoteRes = await fetch('https://api.relay.link/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: admin,
        originChainId: 8453,
        destinationChainId: 480,
        originCurrency: usdcBase,
        destinationCurrency: usdcWorld,
        recipient: recipient,
        amount: withdrawAmountBigInt.toString(),
        tradeType: 'EXACT_INPUT'
      })
    });
    const quote = await quoteRes.json();
    if (!quote.steps) {
      throw new Error('Relay quote failed: ' + JSON.stringify(quote));
    }

    const netReceived = parseFloat(quote.details?.currencyOut?.amountFormatted || '0');
    const feeDeducted = Math.max(0, Math.round((withdrawAmount - netReceived) * 1e6) / 1e6);

    let lastTxHash = withdrawTx;
    for (const step of quote.steps) {
      for (const item of step.items) {
        if (item.status === 'complete') continue;
        const txData = item.data;
        const txHash = await baseWallet.sendTransaction({
          to: txData.to,
          data: txData.data,
          value: BigInt(txData.value || '0')
        });
        lastTxHash = txHash;
        await baseClient.waitForTransactionReceipt({ hash: txHash });
      }
    }

    console.log(`[Bridge] Puente completado. Tx de depósito en Relay: ${lastTxHash}`);

    const newTotal = Math.max(0, Math.round((currentTotal - withdrawAmount) * 1e6) / 1e6);
    const maxCreditsNow = Math.floor((newTotal + 0.000001) / 10);
    const humanBonus = (user.isWorldIdVerified === true) ? 1 : 0;
    const newCredits = Math.min(user.creditos_escritura || 0, maxCreditsNow + humanBonus);

    const updatedUser = await dbAPI.updateUser(userId, {
      total_depositado: newTotal,
      creditos_escritura: newCredits,
      withdraw_request_time: null,
      withdraw_request_amount: 0
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ 
      message: `Retiro de ${withdrawAmount.toFixed(6)} USDC procesado on-chain. Comisión de puente descontada del retiro: ${feeDeducted.toFixed(6)} USDC. Monto neto enviado a tu World App: ${netReceived.toFixed(6)} USDC.`, 
      user: safeUser,
      netWithdraw: netReceived,
      fee: feeDeducted,
      withdrawTx,
      bridgeTx: lastTxHash
    });
  } catch (error) {
    console.error('Confirm withdraw world error:', error);
    const cleanMsg = error.shortMessage || (typeof error.message === 'string' ? error.message.split('\n')[0] : 'Error al ejecutar el retiro on-chain hacia World Chain.');
    res.status(500).json({ error: cleanMsg });
  }
});

// ==========================================
// Get Polygon Tokens (Legacy helper, keep intact)
// ==========================================
router.get('/tokens/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Dirección de wallet inválida' });
    }

    // Popular Polygon tokens
    const tokens = [
      { symbol: 'POL', name: 'POL (ex-MATIC)', address: 'native', decimals: 18, logo: '🟣' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, logo: '🔵' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, logo: '🟢' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, logo: '💎' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, logo: '🟠' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, logo: '🟡' },
      { symbol: 'AAVE', name: 'Aave', address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18, logo: '👻' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18, logo: '🔗' },
    ];

    const RPC_URL = 'https://polygon-rpc.com';

    // Get native POL balance
    const nativeBalanceResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    });

    const nativeResult = await nativeBalanceResponse.json();
    const nativeBalance = parseInt(nativeResult.result || '0', 16);

    // Build batch request for ERC20 balances
    const balanceOfSelector = '0x70a08231';
    const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');

    const batchRequests = tokens
      .filter(t => t.address !== 'native')
      .map((token, index) => ({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: token.address,
          data: balanceOfSelector + paddedAddress
        }, 'latest'],
        id: index + 2
      }));

    let tokenBalances = {};

    if (batchRequests.length > 0) {
      try {
        const batchResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchRequests)
        });

        const batchResults = await batchResponse.json();

        if (Array.isArray(batchResults)) {
          batchResults.forEach((result) => {
            const token = tokens.filter(t => t.address !== 'native')[result.id - 2];
            if (token && result.result) {
              const rawBalance = BigInt(result.result || '0x0');
              tokenBalances[token.symbol] = rawBalance.toString();
            }
          });
        }
      } catch (err) {
        console.error('Batch RPC error:', err.message);
      }
    }

    // Format response
    const result = tokens.map(token => {
      let rawBalance, formattedBalance;

      if (token.address === 'native') {
        rawBalance = nativeBalance.toString();
        formattedBalance = (nativeBalance / Math.pow(10, token.decimals)).toFixed(4);
      } else {
        const raw = tokenBalances[token.symbol] || '0';
        rawBalance = raw;
        const bal = Number(BigInt(raw)) / Math.pow(10, token.decimals);
        formattedBalance = bal.toFixed(4);
      }

      return {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        balance: formattedBalance,
        rawBalance: rawBalance,
        logo: token.logo
      };
    });

    res.json({ tokens: result, address });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Error consultando tokens de Polygon' });
  }
});

export default router;
