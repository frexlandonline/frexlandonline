import { Router } from 'express';
import dbAPI from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─── Save Score ──────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { score, level, linesCleared, duracionPartidaSegundos, walletAddress, platform } = req.body;
    const userId = req.user.id;

    // Modo mantenimiento para guardado de puntajes (solo Admin y Técnico)
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

    const IS_MAINTENANCE_MODE = true;
    if (IS_MAINTENANCE_MODE && !isAdmin && !isTecnico) {
      return res.status(503).json({ error: 'Los servidores de juego se encuentran en modo mantenimiento temporal.' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Puntaje inválido' });
    }

    // 2. Anti-Cheat Estadístico Básico
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

    const saved = await dbAPI.saveHighScore(userId, score, level || 1, linesCleared || 0, platform || 'html5', walletAddress);

    res.status(201).json({
      message: 'Puntaje guardado',
      score: saved,
      rank: saved.rank
    });
  } catch (error) {
    console.error('Save score error:', error);
    if (error.message.includes('créditos suficientes')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get Global Leaderboard (Top 10) ─────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const leaderboard = await dbAPI.getLeaderboard(limit);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Get User's Scores (Legacy / Unsupported in first draft) ──
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // For simplicity, we fallback to sqlite direct or simulated data for personal history
    // Since it's a minor view, let's keep it simple:
    let scores = [];
    let best = { best_score: 0, total_games: 0, total_lines: 0 };
    
    // We can fetch from local DB or Firestore
    // Let's implement a quick mock/retrieve
    const user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Return structure
    res.json({
      scores: [],
      stats: {
        bestScore: 0,
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
