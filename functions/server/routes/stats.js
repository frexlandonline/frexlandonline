import { Router } from 'express';
import dbAPI from '../db.js';

const router = Router();

router.get('/rewards', async (req, res) => {
  try {
    const users = await dbAPI.getAllUsers();
    let totalInterest = 0;
    const now = Date.now();

    users.forEach(user => {
      // time in years
      const createdAt = new Date(user.createdAt || now).getTime();
      const msDiff = Math.max(0, now - createdAt);
      const years = msDiff / (1000 * 60 * 60 * 24 * 365);
      
      // APY 4% (0.04) continuous-like compounding formula: A = P(1+r)^t
      // We simulate each user deposited 10 USDC at registration
      const interest = 10 * (Math.pow(1.04, years) - 1);
      totalInterest += interest;
    });

    const prizePool = totalInterest * 0.70;
    const ownerProfit = totalInterest * 0.30;

    res.json({
      success: true,
      usersCount: users.length,
      totalSimulatedDeposit: users.length * 10,
      totalInterest,
      prizePool,
      ownerProfit
    });
  } catch (error) {
    console.error('Rewards calc error:', error);
    res.status(500).json({ error: 'Error al calcular las recompensas' });
  }
});

router.get('/global', async (req, res) => {
  try {
    const totalDeposited = await dbAPI.getTotalDepositedAllUsers();
    res.json({ success: true, totalDeposited });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadisticas globales' });
  }
});

export default router;
