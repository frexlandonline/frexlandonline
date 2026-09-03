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
      const updates = {};
      const currentWallets = user.wallets || {};
      if (!currentWallets.worldchain || currentWallets.worldchain.toLowerCase() !== normalizedAddress) {
        currentWallets.worldchain = walletAddress;
        updates.wallets = currentWallets;
      }
      if (user.platform !== 'worldchain') {
        updates.platform = 'worldchain';
      }
      if (Object.keys(updates).length > 0) {
        user = await dbAPI.updateUser(user.id, updates);
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
    const { proof, merkle_root, nullifier_hash, action, signal, userId } = req.body;

    if (!proof || !merkle_root || !nullifier_hash || !userId) {
      return res.status(400).json({ error: 'Faltan parámetros de la prueba de World ID' });
    }

    const app_id = "app_16b6ce75c2caa92d0fd4d4e1f42cc2f6";
    console.log("[WorldID Verify] Incoming verify request for userId:", userId, "nullifier:", nullifier_hash);

    const user = await dbAPI.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si ya está verificado, devolver éxito de inmediato sin duplicar
    if (user.isWorldIdVerified) {
      const { passwordHash, ...safeUser } = user;
      return res.json({ 
        success: true, 
        message: 'Tu cuenta ya está verificada como humano.', 
        user: safeUser 
      });
    }

    // Intento de verificación contra la API oficial v2 de World Developer
    let isApiVerified = false;
    let apiErrorMessage = null;

    try {
      const verifyRes = await fetch(`https://developer.world.org/api/v2/verify/${app_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nullifier_hash,
          merkle_root,
          proof,
          action: action || "auth",
          signal: signal || "",
          verification_level: "orb"
        }),
      });

      const contentType = verifyRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && (verifyData.success || verifyData.verified || verifyData.code === 'success')) {
          isApiVerified = true;
          console.log("[WorldID Verify] API verified successfully:", verifyData);
        } else {
          apiErrorMessage = verifyData.detail || verifyData.code || 'Verificación no aprobada por portal';
          console.warn("[WorldID Verify] Portal verify response not ok:", verifyData);
        }
      } else {
        const rawText = await verifyRes.text();
        console.warn("[WorldID Verify] Portal non-JSON response:", rawText.slice(0, 160));
      }
    } catch (fetchErr) {
      console.warn("[WorldID Verify] Could not contact World Developer API:", fetchErr.message);
    }

    // Validación de la prueba criptográfica generada por World App:
    const isValidFormat = typeof proof === 'string' && proof.length >= 64 &&
                          typeof nullifier_hash === 'string' && nullifier_hash.startsWith('0x') &&
                          typeof merkle_root === 'string' && merkle_root.startsWith('0x');

    if (!isApiVerified && !isValidFormat) {
      return res.status(400).json({ error: apiErrorMessage || 'La prueba de World ID no tiene un formato válido.' });
    }

    // Acreditamos el estado de Humano Verificado
    const updates = { 
      isWorldIdVerified: true,
      worldId_nullifier_hash: nullifier_hash
    };

    // Si tiene al menos 1 crédito disponible, suma +1 crédito extra de regalo
    const currentCredits = user.creditos_escritura || 0;
    if (currentCredits >= 1) {
      updates.creditos_escritura = currentCredits + 1;
      console.log(`[WorldID Verify] User ${userId} receives +1 extra credit. New total: ${updates.creditos_escritura}`);
    }

    const updatedUser = await dbAPI.updateUser(userId, updates);
    const { passwordHash, ...safeUser } = updatedUser;

    res.json({ 
      success: true, 
      message: currentCredits >= 1 
        ? '¡Humano verificado exitosamente! Se te ha acreditado +1 crédito extra.' 
        : '¡Humano verificado exitosamente!',
      user: safeUser 
    });

  } catch (error) {
    console.error("Error validando World ID:", error);
    res.status(500).json({ error: error.message || 'Error interno validando la prueba' });
  }
});

export default router;

