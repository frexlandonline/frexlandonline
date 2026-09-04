import { Router } from 'express';
import dbAPI from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { distributePrizes } from '../cron.js';

const router = Router();
const ADMIN_WALLETS = [
  '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
  '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
];
const ADMIN_EMAIL = 'frexland.online@gmail.com';

// Middleware para verificar si es admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await dbAPI.getUserById(req.user.id);
    const userWallets = (user && user.walletAddresses ? user.walletAddresses : []).concat(
      user && user.wallets ? Object.values(user.wallets) : []
    ).map(w => (w || '').toLowerCase());
    
    const hasAdminWallet = userWallets.some(addr => ADMIN_WALLETS.includes(addr));
    const hasAdminEmail = user && user.email === ADMIN_EMAIL;
    const isExplicitAdmin = user && (user.isAdmin === true || user.role === 'admin');
    
    if (!hasAdminWallet && !hasAdminEmail && !isExplicitAdmin) {
      return res.status(403).json({ error: 'Acceso denegado. No eres el administrador.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

// ─── Get Admin Profit Stats ─────────────────────────────────────────────
router.get('/profit-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const withdrawnStr = await dbAPI.getSystemConfig('admin_withdrawn_profit');
    const withdrawn = parseFloat(withdrawnStr || '0');
    
    // Devolver también el total depositado real según la base de datos
    const totalDeposited = await dbAPI.getTotalDepositedAllUsers();
    
    // Devolver historial de retiros
    const history = await dbAPI.getAdminWithdrawals();
    
    console.log('[API Admin] /profit-stats: withdrawn=', withdrawn, 'totalDeposited=', totalDeposited);
    
    res.json({ withdrawn, totalDeposited, history });
  } catch (error) {
    console.error('Profit stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// ─── Withdraw Admin Profit ─────────────────────────────────────────────
router.post('/withdraw-profit', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido.' });
    }

    const withdrawnStr = await dbAPI.getSystemConfig('admin_withdrawn_profit');
    const currentWithdrawn = parseFloat(withdrawnStr || '0');
    const newWithdrawn = currentWithdrawn + amount;

    await dbAPI.updateSystemConfig('admin_withdrawn_profit', newWithdrawn.toString());
    await dbAPI.recordAdminWithdrawal(amount);
    
    res.json({ message: `Ganancia registrada. Total retirado histórico: ${newWithdrawn} USDC` });
  } catch (error) {
    console.error('Withdraw profit error:', error);
    res.status(500).json({ error: 'Error al registrar la ganancia.' });
  }
});

// ─── Manual Prize Distribution (Admin only) ──────────────────────────
router.post('/distribute-prizes', authenticateToken, isAdmin, async (req, res) => {
  try {
    await distributePrizes();
    res.json({ success: true, message: 'Distribución de premios ejecutada manualmente.' });
  } catch (error) {
    console.error('Manual distribute prizes error:', error);
    res.status(500).json({ error: 'Error al ejecutar distribución de premios.' });
  }
});

// ─── Clear Prize Notification (For any user) ──────────────────────────
router.post('/clear-prize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await dbAPI.updateUser(userId, {
      pending_prize_amount: 0,
      pending_prize_rank: 0
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al limpiar notificación de premio.' });
  }
});

export default router;
