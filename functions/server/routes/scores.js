import { Router } from 'express';
import dbAPI from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─── Save Competition Score (Consume 1 crédito) ──────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { score, level, linesCleared, duracionPartidaSegundos, walletAddress, platform, gameId, unlockedSlots } = req.body;
    const userId = req.user.id;

    const ADMIN_WALLETS = [
      '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
      '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
    ];
    const TECNICO_EMAILS = ['tecnico@frexland.com', 'tester@frexland.com'];
    const user = await dbAPI.getUserById(userId);
    const userWallets = (user?.walletAddresses || []).concat(
      user?.wallets ? Object.values(user.wallets) : []
    ).map(w => (w || '').toLowerCase());
    const isAdmin = user && (user.isAdmin === true || user.role === 'admin' || userWallets.some(w => ADMIN_WALLETS.includes(w)));
    const isTecnico = user && (user.role === 'tecnico' || user.role === 'tester' || TECNICO_EMAILS.includes((user.email || '').toLowerCase()));

    const IS_MAINTENANCE_MODE = false;
    if (IS_MAINTENANCE_MODE && !isAdmin && !isTecnico) {
      return res.status(503).json({ error: 'Los servidores de juego se encuentran en modo mantenimiento temporal.' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Puntaje inválido' });
    }

    // Anti-Cheat Estadístico Básico
    if (duracionPartidaSegundos) {
      if (duracionPartidaSegundos < 10 && score > 100) {
        return res.status(400).json({ error: 'Partida demasiado corta' });
      }
      
      const MAX_SCORE_PER_SECOND = 1500;
      const scoreRate = score / duracionPartidaSegundos;
      if (scoreRate > MAX_SCORE_PER_SECOND) {
        console.warn(`[ANTI-CHEAT] Usuario ${userId} excedió el límite: ${scoreRate} pts/s`);
        return res.status(400).json({ error: 'Puntaje anómalo detectado' });
      }
    }

    if (walletAddress) {
      const normalizedWallet = walletAddress.toLowerCase().trim();
      const existingUser = await dbAPI.getUserByWalletAddress(normalizedWallet);
      if (existingUser && String(existingUser.id) !== String(userId)) {
        return res.status(400).json({ error: 'Esta billetera ya está vinculada a otro perfil. No puedes usarla para registrar puntajes.' });
      }
    }

    await dbAPI.checkAndResetDailyCredits(userId);
    const saved = await dbAPI.saveHighScore(
      userId,
      score,
      level || 1,
      linesCleared || 0,
      platform || 'html5',
      walletAddress,
      gameId || 'blockdrop',
      unlockedSlots || 3
    );

    res.status(201).json({
      message: 'Puntaje guardado',
      score: saved,
      rank: saved.rank,
      unlockedSlots: saved.unlockedSlots
    });
  } catch (error) {
    console.error('Save score error:', error);
    if (error.message.includes('créditos suficientes')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Save Global Informative High Score (Sin gastar créditos, todos los usuarios incluidos Sin Rango) ───
router.post('/global', authenticateToken, async (req, res) => {
  try {
    const { score, level, linesCleared, duracionPartidaSegundos, gameId } = req.body;
    const userId = req.user.id;

    if (typeof score !== 'number' || score <= 0) {
      return res.status(400).json({ error: 'Puntaje inválido' });
    }

    if (duracionPartidaSegundos) {
      if (duracionPartidaSegundos < 5 && score > 100) {
        return res.status(400).json({ error: 'Partida demasiado corta' });
      }
      const MAX_SCORE_PER_SECOND = 1500;
      if ((score / duracionPartidaSegundos) > MAX_SCORE_PER_SECOND) {
        return res.status(400).json({ error: 'Puntaje anómalo detectado' });
      }
    }

    const result = await dbAPI.saveGlobalHighScore(
      userId,
      score,
      level || 1,
      linesCleared || 0,
      gameId || 'blockdrop'
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Save global score error:', error);
    res.status(500).json({ error: 'Error al registrar puntaje en la tabla global.' });
  }
});

// ─── Get Competition Leaderboard & Dynamic Unlocked Slots ────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const gameId = (req.query.gameId || 'blockdrop').toLowerCase().trim();
    const poolBalance = parseFloat(req.query.poolBalance || '0');

    const [metaBlockdrop, metaSnake] = await Promise.all([
      dbAPI.getCompetitionMeta('blockdrop'),
      dbAPI.getCompetitionMeta('snake')
    ]);

    const currentMeta = gameId === 'snake' ? metaSnake : metaBlockdrop;
    let unlockedSlots = currentMeta.unlockedSlots || 3;

    // Escalado progresivo:
    // 1) Al principio solo se reparte entre los 3 primeros (unlockedSlots = 3).
    // 2) Cuando el premio del 3er puesto (10% del pozo) supera 10 USDC, habilita los primeros 10 siguientes (unlockedSlots = 13).
    // 3) Cuando el premio de esos 10 siguientes supera 10 USDC c/u, habilita los siguientes 10 (23, 33...) y así sucesivamente.
    if (poolBalance > 0) {
      const thirdPlacePrize = poolBalance * 0.10;
      const tenPercent = poolBalance * 0.10;
      let dynamicSecondary = Math.max(0, unlockedSlots - 3);
      if (thirdPlacePrize > 10) {
        dynamicSecondary = Math.max(10, dynamicSecondary);
        while ((tenPercent / dynamicSecondary) > 10) {
          dynamicSecondary += 10;
        }
      }
      const newTotalSlots = 3 + dynamicSecondary;
      if (newTotalSlots > unlockedSlots) {
        unlockedSlots = await dbAPI.setUnlockedSlots(gameId, newTotalSlots);
      }
    }

    const limit = Math.min(parseInt(req.query.limit) || Math.max(50, unlockedSlots), 200);
    const leaderboard = await dbAPI.getLeaderboard(limit, gameId);

    const totalSubs = (metaBlockdrop.submissionsCount || 0) + (metaSnake.submissionsCount || 0);
    const gamesDistribution = {
      blockdrop: {
        count: metaBlockdrop.submissionsCount || 0,
        submissions: metaBlockdrop.submissionsCount || 0,
        percentage: totalSubs > 0 ? Math.round(((metaBlockdrop.submissionsCount || 0) / totalSubs) * 100) : 100
      },
      snake: {
        count: metaSnake.submissionsCount || 0,
        submissions: metaSnake.submissionsCount || 0,
        percentage: totalSubs > 0 ? Math.round(((metaSnake.submissionsCount || 0) / totalSubs) * 100) : 0
      },
      totalSubmissions: totalSubs
    };

    res.json({
      leaderboard,
      unlockedSlots,
      secondarySlots: Math.max(0, unlockedSlots - 3),
      submissionsCount: currentMeta.submissionsCount || 0,
      gamesDistribution
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get Global Informative Leaderboard (Usuario - Puntaje - Rango) ──
router.get('/global-leaderboard', async (req, res) => {
  try {
    const gameId = (req.query.gameId || 'blockdrop').toLowerCase().trim();
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const globalLeaderboard = await dbAPI.getGlobalLeaderboard(gameId, limit);

    res.json({
      gameId,
      leaderboard: globalLeaderboard,
      globalLeaderboard
    });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get User's Scores ───────────────────────────────────────────────
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      scores: [],
      stats: {
        bestScore: user.high_score || 0,
        totalGames: 0,
        totalLines: 0
      }
    });
  } catch (error) {
    console.error('My scores error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
