import { Router } from 'express';
import dbAPI from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

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
// ─── Deposit USDC for Credits ──────────────────────────────────
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0.01) {
      return res.status(400).json({ error: 'El monto a depositar debe ser mayor a 0.01 USDC para cubrir la comisión de red.' });
    }

    const user = await dbAPI.checkAndResetDailyCredits(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comisión fija de red / puente CCTP (0.01 USDC)
    const BRIDGE_FEE = 0.01;
    const netAmount = Math.max(0, Math.round((depositAmount - BRIDGE_FEE) * 1e6) / 1e6);

    const currentTotal = user.total_depositado || 0;
    const newTotal = Math.round((currentTotal + netAmount) * 1e6) / 1e6;

    // Calcular créditos ganados: 1 crédito por cada 10 USDC netos acumulados
    const oldCreditsFromDeposit = Math.floor((currentTotal + 0.015) / 10);
    const newCreditsFromDeposit = Math.floor((newTotal + 0.015) / 10);
    const creditsToAdd = Math.max(0, newCreditsFromDeposit - oldCreditsFromDeposit);

    const currentCredits = user.creditos_escritura || 0;

    const updatedUser = await dbAPI.updateUser(userId, {
      creditos_escritura: currentCredits + creditsToAdd,
      total_depositado: newTotal
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ 
      message: `Depósito de ${depositAmount} USDC procesado. Comisión de red descontada: ${BRIDGE_FEE} USDC. Monto neto en Aave: ${netAmount.toFixed(6)} USDC (+${creditsToAdd} créditos).`, 
      user: safeUser,
      netAmount,
      fee: BRIDGE_FEE
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
    const newCredits = Math.min(user.creditos_escritura || 0, maxCreditsNow);

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

    // TODO: Ejecutar el reverse bridge on-chain
    // 1. Retirar USDC de Aave V3 en Base
    // 2. burnOnBase(amount) usando TokenMessengerV2 en Base
    // 3. Obtener attestation de Circle Iris API
    // 4. mintOnWorldChain() enviándolo al wallet del usuario

    console.log(`[CCTP Reverse Bridge] Retirando ${amount} USDC hacia World Chain para usuario ${userId}`);

    const BRIDGE_FEE = 0.01;
    const netWithdraw = Math.max(0, Math.round((amount - BRIDGE_FEE) * 1e6) / 1e6);

    const newTotal = Math.max(0, Math.round((currentTotal - amount) * 1e6) / 1e6);
    const maxCreditsNow = Math.floor((newTotal + 0.015) / 10);
    const newCredits = Math.min(user.creditos_escritura || 0, maxCreditsNow);

    const updatedUser = await dbAPI.updateUser(userId, {
      total_depositado: newTotal,
      creditos_escritura: newCredits,
      withdraw_request_time: null,
      withdraw_request_amount: 0
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ 
      message: `Retiro de ${amount} USDC procesado. Comisión de red descontada: ${BRIDGE_FEE} USDC. Monto neto enviado a tu billetera de World App: ${netWithdraw.toFixed(6)} USDC.`, 
      user: safeUser,
      netWithdraw,
      fee: BRIDGE_FEE
    });
  } catch (error) {
    console.error('Confirm withdraw world error:', error);
    res.status(500).json({ error: 'Error interno del servidor al confirmar retiro hacia World Chain.' });
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
