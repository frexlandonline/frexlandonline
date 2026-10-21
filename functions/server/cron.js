import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import dbAPI, { calculateDepositCredits } from './db.js';

// CONTRATO SEGURO DESPLEGADO EN BASE
const CONTRACT_ADDRESS = '0xa129A50c3303057eC25780da0f645a977Bbf66bb';
const aUSDCAddress = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';

const aUSDC_ABI = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }];

const ADMIN_WALLETS = [
  '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase(),
  '0xf22d1687d3e6990b499ce9c7a417f0d8fae3e1c2'.toLowerCase()
];
const ADMIN_EMAIL = 'frexland.online@gmail.com';

/**
 * Obtiene las tasas de comisión de referidos según el depósito del referente en el momento del reparto:
 * - Plata (50 a <100): 1% N1, 0% N2
 * - Oro (100 a <500): 3% N1, 0% N2
 * - Platino (500 a <1000): 5% N1, 1% N2
 * - Diamante (>= 1000): 5% N1, 3% N2
 */
function getReferrerRatesAtDistribution(depositAmount = 0) {
  const d = Number(depositAmount) || 0;
  if (d >= 1000) return { l1: 0.05, l2: 0.03 };
  if (d >= 500) return { l1: 0.05, l2: 0.01 };
  if (d >= 100) return { l1: 0.03, l2: 0 };
  if (d >= 50) return { l1: 0.01, l2: 0 };
  return { l1: 0, l2: 0 };
}

/**
 * Calcula cuántos puestos secundarios (después del 3er puesto) corresponden según el pozo del juego:
 * - Al principio solo se reparte entre los 3 primeros (0 puestos secundarios, total 3 puestos).
 * - Cuando el premio del 3er puesto (10% del pozo del juego) sea mayor a 10 USDC, habilita el reparto a los primeros 10 siguientes (puestos 4 al 13).
 * - Cuando el premio de esos 10 siguientes supere 10 USDC c/u, habilita los siguientes 10 (20 siguientes, 30 siguientes, etc.).
 */
export function calculateSecondarySlotsCount(gamePrizePool = 0, currentUnlockedSlots = 3) {
  const thirdPlacePrize = Number(gamePrizePool) * 0.10;
  const tenPercentPool = Number(gamePrizePool) * 0.10;
  const fromUnlocked = Math.max(0, (Number(currentUnlockedSlots) || 3) - 3);

  if (thirdPlacePrize <= 10 && fromUnlocked === 0) {
    return 0;
  }

  let nextSlots = 10;
  while ((tenPercentPool / nextSlots) > 10) {
    nextSlots += 10;
  }
  return Math.max(nextSlots, fromUnlocked);
}

export async function distributePrizes() {
  console.log('🏆 Iniciando distribución de premios semanal (70% Juegos / 30% Proyecto)...');
  try {
    const client = createPublicClient({ chain: base, transport: http() });
    
    // 1. Obtener interés generado en Aave V3
    const totalDeposited = await dbAPI.getTotalDepositedAllUsers();
    
    const currentBalanceRaw = await client.readContract({
      address: aUSDCAddress,
      abi: aUSDC_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESS]
    });

    const currentBalance = Number(currentBalanceRaw) / 1e6;
    const interest = Math.max(0, currentBalance - totalDeposited);
    
    if (interest <= 0) {
      console.log('⚠️ No hay interés suficiente para repartir premios esta semana.');
      await dbAPI.clearAllScores();
      await renewAllUsersWeeklyCredits();
      return;
    }

    // 2. División Global: Siempre 30% para el Proyecto y 70% para los distintos Juegos
    let projectTotalDeposit = interest * 0.30;
    const totalGamesPrizePool = interest * 0.70;

    // 3. Cargar snapshot de todos los usuarios en el momento exacto de repartir premios
    const allUsers = await dbAPI.getAllUsers();
    const usersSnapshotMap = new Map();
    allUsers.forEach(u => {
      usersSnapshotMap.set(String(u.id), {
        ...u,
        snapshotDeposit: Number(u.total_depositado) || 0
      });
    });

    // 4. Obtener métricas de grabaciones de puntaje por cada juego para repartir el 70%
    const gameIds = ['blockdrop', 'snake'];
    const gamesData = {};
    let totalSubmissionsAllGames = 0;

    for (const gId of gameIds) {
      const [meta, scores] = await Promise.all([
        dbAPI.getCompetitionMeta(gId),
        dbAPI.getLeaderboard(500, gId)
      ]);
      const subCount = Math.max(meta.submissionsCount || 0, scores.length);
      gamesData[gId] = {
        meta,
        scores,
        submissionsCount: subCount
      };
      totalSubmissionsAllGames += subCount;
    }

    if (totalSubmissionsAllGames === 0) {
      console.log('⚠️ No hubo grabaciones de puntaje en ningún juego. El interés queda acumulado o pasa al proyecto.');
      await dbAPI.clearAllScores();
      await renewAllUsersWeeklyCredits();
      return;
    }

    // Acumuladores de pagos para usuarios: userId -> { prizeReward: 0, referralReward: 0, ranks: [] }
    const userPayouts = {};
    const ensurePayoutEntry = (uid) => {
      const key = String(uid);
      if (!userPayouts[key]) {
        userPayouts[key] = { prizeReward: 0, referralReward: 0, ranks: [] };
      }
      return userPayouts[key];
    };

    // 5. Repartir el pozo de cada juego según su proporción de grabaciones de puntaje
    for (const gId of gameIds) {
      const gInfo = gamesData[gId];
      if (gInfo.submissionsCount <= 0 || gInfo.scores.length === 0) continue;

      const gameShareRatio = gInfo.submissionsCount / totalSubmissionsAllGames;
      const gamePool = totalGamesPrizePool * gameShareRatio;

      // Escalado dinámico: al inicio 0 secundarios (solo Top 3); cuando 3ro > 10 USDC pasa a 10, 20, 30...
      const secondaryCount = calculateSecondarySlotsCount(gamePool, gInfo.meta.unlockedSlots);
      const totalPrizePositions = 3 + secondaryCount;

      // Si solo están habilitados los 3 primeros puestos, el 100% del pozo del juego se reparte entre el Top 3 (50/90, 30/90, 10/90).
      // Cuando se habilitan los puestos siguientes (10, 20, 30...), es 1ro 50%, 2do 30%, 3ro 10% y 10% entre secondaryCount.
      const secondaryIndividualShare = secondaryCount > 0 ? (0.10 / secondaryCount) : 0;

      for (let posIdx = 0; posIdx < totalPrizePositions; posIdx++) {
        const rank = posIdx + 1;
        let positionPercentage = 0;
        if (secondaryCount === 0) {
          if (posIdx === 0) positionPercentage = 0.50 / 0.90;
          else if (posIdx === 1) positionPercentage = 0.30 / 0.90;
          else if (posIdx === 2) positionPercentage = 0.10 / 0.90;
        } else {
          if (posIdx === 0) positionPercentage = 0.50;
          else if (posIdx === 1) positionPercentage = 0.30;
          else if (posIdx === 2) positionPercentage = 0.10;
          else positionPercentage = secondaryIndividualShare;
        }

        const grossPrize = gamePool * positionPercentage;
        if (grossPrize <= 0) continue;

        const scoreEntry = gInfo.scores[posIdx];
        if (!scoreEntry) {
          // Puesto vacante: el premio no reclamado se suma al proyecto / administrador
          projectTotalDeposit += grossPrize;
          continue;
        }

        const winnerId = String(scoreEntry.userId || scoreEntry.id);
        const winnerSnapshot = usersSnapshotMap.get(winnerId);
        if (!winnerSnapshot) {
          projectTotalDeposit += grossPrize;
          continue;
        }

        const winnerDeposit = winnerSnapshot.snapshotDeposit;

        // Verificar Rango del ganador en el momento del reparto
        if (winnerDeposit < 10) {
          // Rango Madera (1 a <10 USDC): gana proporcional a lo depositado (10% por cada 1 USDC)
          const maderaFactor = Math.min(1, Math.max(0, winnerDeposit / 10));
          const maderaPrize = grossPrize * maderaFactor;
          const maderaRemainder = grossPrize - maderaPrize;

          // El resto del premio del nivel Madera se deposita al proyecto / administrador
          projectTotalDeposit += maderaRemainder;

          if (maderaPrize > 0) {
            const pEntry = ensurePayoutEntry(winnerId);
            pEntry.prizeReward += maderaPrize;
            pEntry.ranks.push(`${gId.toUpperCase()} #${rank} (${Math.round(maderaFactor * 100)}% Madera)`);
          }
        } else {
          // Rango Bronce o mayor (>= 10 USDC): gana el 100%, sujeto a descuento de referidos si aplica
          let netWinnerPrize = grossPrize;

          if (winnerSnapshot.referred_by) {
            const refL1 = usersSnapshotMap.get(String(winnerSnapshot.referred_by));
            if (refL1) {
              const ratesL1 = getReferrerRatesAtDistribution(refL1.snapshotDeposit);
              if (ratesL1.l1 > 0) {
                const commL1 = grossPrize * ratesL1.l1;
                netWinnerPrize -= commL1;
                const ref1Entry = ensurePayoutEntry(refL1.id);
                ref1Entry.referralReward += commL1;
              }

              // Verificar Nivel 2 (Referido de Referido) si refL1 también fue referido
              if (refL1.referred_by) {
                const refL2 = usersSnapshotMap.get(String(refL1.referred_by));
                if (refL2) {
                  const ratesL2 = getReferrerRatesAtDistribution(refL2.snapshotDeposit);
                  if (ratesL2.l2 > 0) {
                    const commL2 = grossPrize * ratesL2.l2;
                    netWinnerPrize -= commL2;
                    const ref2Entry = ensurePayoutEntry(refL2.id);
                    ref2Entry.referralReward += commL2;
                  }
                }
              }
            }
          }

          const pEntry = ensurePayoutEntry(winnerId);
          pEntry.prizeReward += Math.max(0, netWinnerPrize);
          pEntry.ranks.push(`${gId.toUpperCase()} #${rank}`);
        }
      }
    }

    // 6. Aplicar pagos a los usuarios ganadores y referentes
    for (const [uid, payout] of Object.entries(userPayouts)) {
      const user = await dbAPI.getUserById(uid);
      if (!user) continue;

      const totalToAdd = (payout.prizeReward || 0) + (payout.referralReward || 0);
      if (totalToAdd <= 0) continue;

      const newTotalDeposit = Number(((Number(user.total_depositado) || 0) + totalToAdd).toFixed(6));
      const newRefEarnings = Number(((Number(user.referral_earnings) || 0) + (payout.referralReward || 0)).toFixed(6));
      const ranksLabel = payout.ranks.length > 0 ? payout.ranks.join(', ') : 'Comisión de Referidos';

      await dbAPI.updateUser(uid, {
        total_depositado: newTotalDeposit,
        referral_earnings: newRefEarnings,
        pending_prize_amount: Number(totalToAdd.toFixed(6)),
        pending_prize_rank: ranksLabel
      });

      console.log(`🏆 Usuario ${user.username}: +${ payout.prizeReward.toFixed(4) } USDC premio | +${ payout.referralReward.toFixed(4) } USDC referidos (${ranksLabel})`);
    }

    // 7. Depositar el 30% del Proyecto + remanentes de Madera/vacantes en la cuenta del Proyecto / Administrador
    if (projectTotalDeposit > 0) {
      const adminUser = allUsers.find(u => {
        const wallets = (u.walletAddresses || []).concat(u.wallets ? Object.values(u.wallets) : []).map(w => (w || '').toLowerCase());
        return u.email === ADMIN_EMAIL || u.isAdmin === true || u.role === 'admin' || wallets.some(w => ADMIN_WALLETS.includes(w));
      });

      if (adminUser) {
        const freshAdmin = await dbAPI.getUserById(adminUser.id);
        const updatedAdminDeposit = Number(((Number(freshAdmin?.total_depositado) || 0) + projectTotalDeposit).toFixed(6));
        await dbAPI.updateUser(adminUser.id, {
          total_depositado: updatedAdminDeposit
        });
        console.log(`💼 Proyecto / Admin (${adminUser.username}): +${projectTotalDeposit.toFixed(6)} USDC depositados al finalizar la semana.`);
      }

      const prevProjectProfit = parseFloat(await dbAPI.getSystemConfig('project_accumulated_profit') || '0');
      await dbAPI.updateSystemConfig('project_accumulated_profit', (prevProjectProfit + projectTotalDeposit).toFixed(6));
    }

    // 8. Limpiar todos los puntajes de competencia semanal y renovar créditos semanales
    await dbAPI.clearAllScores();
    await renewAllUsersWeeklyCredits();
    
    console.log('✅ Distribución semanal de premios y referidos completada.');
  } catch (error) {
    console.error('❌ Error distribuyendo premios:', error);
  }
}

async function renewAllUsersWeeklyCredits() {
  try {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const currentWeekCycle = String(Math.floor(Date.now() / WEEK_MS));
    const allUsers = await dbAPI.getAllUsers();
    for (const u of allUsers) {
      const depositCredits = calculateDepositCredits(u.total_depositado || 0);
      const humanBonus = (u.isWorldIdVerified === true) ? 1 : 0;
      const totalWeeklyCredits = depositCredits + humanBonus;
      await dbAPI.updateUser(u.id, {
        creditos_escritura: totalWeeklyCredits,
        last_credit_reset: currentWeekCycle
      });
    }
    console.log('🔄 Créditos semanales renovados para todos los usuarios tras la entrega de premios.');
  } catch (err) {
    console.error('Error renovando créditos semanales:', err);
  }
}

export function startCron() {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const timeSinceLastReset = now % WEEK_MS;
  const timeLeft = WEEK_MS - timeSinceLastReset;
  
  console.log(`⏱️ Sincronizando Cron de premios. Primer disparo en ${Math.floor(timeLeft / (60 * 60 * 1000))} horas.`);
  
  setTimeout(() => {
    distributePrizes();
    setInterval(distributePrizes, WEEK_MS);
  }, timeLeft);
}
