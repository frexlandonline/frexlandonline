import { Router } from 'express';
import dbAPI from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// ==========================================
// Login desde World App Mini App
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Dirección de wallet requerida' });
    }

    // TODO: Idealmente aquí verificaríamos la firma SIWE (message, signature) 
    // usando la librería viem o ethers para asegurar que el usuario realmente 
    // posee la wallet que indica. Por ahora confiamos en el payload.

    const normalizedAddress = walletAddress.toLowerCase().trim();

    let user = await dbAPI.getUserByWalletAddress(normalizedAddress);

    if (!user) {
      const displayName = `WorldUser_${normalizedAddress.slice(2, 8)}`;
      const walletsMap = { worldchain: walletAddress };

      user = await dbAPI.createUser({
        username: displayName,
        emailVerified: true,
        wallets: walletsMap,
        platform: 'worldchain'
      });
    } else {
      // Si ya existe pero no tenía plataforma asignada (por error previo)
      if (user.platform !== 'worldchain') {
        user = await dbAPI.updateUser(user.id, { platform: 'worldchain' });
      }
    }

    const token = generateToken(user);

    res.json({
      message: 'Login con World App exitoso',
      token,
      user,
      isNewUser: !user.email
    });
  } catch (error) {
    console.error('World login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// Verificación de Humano Único (World ID Orb)
// ==========================================
router.post('/verify', async (req, res) => {
  try {
    // Requires authentication via Bearer token (added dynamically in front-end)
    const { proof, merkle_root, nullifier_hash, action, signal, userId } = req.body;

    if (!proof || !merkle_root || !nullifier_hash || !userId) {
      return res.status(400).json({ error: 'Faltan parámetros de la prueba de World ID' });
    }

    const app_id = "app_16b6ce75c2caa92d0fd4d4e1f42cc2f6";

    console.log("Verifying World ID with payload:", { nullifier_hash, action, signal });

    // Verificamos la prueba contra la API de Worldcoin
    const verifyRes = await fetch(`https://developer.worldcoin.org/api/v1/verify/${app_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nullifier_hash,
        merkle_root,
        proof,
        action,
        signal,
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyRes.ok) {
      // Prueba válida
      const user = await dbAPI.getUserById(userId);
      const updates = { isWorldIdVerified: true };
      if (user && !user.isWorldIdVerified && (user.creditos_escritura || 0) >= 1) {
        updates.creditos_escritura = (user.creditos_escritura || 0) + 1;
      }
      const updatedUser = await dbAPI.updateUser(userId, updates);
      res.json({ success: true, message: 'Humano verificado exitosamente', user: updatedUser });
    } else {
      // Prueba inválida
      console.error("World ID verification failed:", verifyData);
      res.status(400).json({ error: verifyData.detail || 'Fallo la verificación de World ID' });
    }
  } catch (error) {
    console.error("Error validando World ID:", error);
    res.status(500).json({ error: 'Error interno validando la prueba' });
  }
});

export default router;

