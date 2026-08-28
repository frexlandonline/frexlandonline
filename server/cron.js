import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import dbAPI from './db.js';

// CONTRATO SEGURO DESPLEGADO EL 06-AGO-2026
const CONTRACT_ADDRESS = '0xa129A50c3303057eC25780da0f645a977Bbf66bb';
const aUSDCAddress = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';

const CONTRACT_ABI = [{ name: 'totalCapitalDepositado', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }];
const aUSDC_ABI = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }];

export async function distributePrizes() {
  console.log('🏆 Iniciando distribución de premios semanal...');
  try {
    const client = createPublicClient({ chain: base, transport: http() });
    
    // 1. Obtener interés generado
    // En lugar de obtener totalCapitalDepositado del contrato, usamos la suma real
    // en base de datos de todo lo que los usuarios han depositado/ganado, para que refleje fielmente los retiros y premios.
    const totalDeposited = await dbAPI.getTotalDepositedAllUsers();
    
    const currentBalanceRaw = await client.readContract({
      address: aUSDCAddress,
      abi: aUSDC_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESS]
    });

    const currentBalance = Number(currentBalanceRaw) / 1e6;
    let interest = Math.max(0, currentBalance - totalDeposited);
    
    // El interés actual medido (currentBalance - totalDeposited) representa el interés generado no retirado.
    // El 70% de este interés va al pool de premios. 
    
    const prizePool = interest * 0.70;
    
    if (prizePool <= 0) {
      console.log('⚠️ No hay interés suficiente para repartir premios.');
      await dbAPI.clearAllScores();
      return;
    }

    // 2. Obtener Top 3 Scores (no usuarios, sino puntajes)
    const topScores = await dbAPI.getLeaderboard(3);
    
    if (topScores.length === 0) {
      console.log('⚠️ No hay jugadores con puntaje para repartir premios.');
      return;
    }

    const rewardPercentages = [0.50, 0.35, 0.15];
    const userRewards = {}; // userId -> { totalReward, ranks: [] }

    // 3. Agrupar premios por usuario si ocupan múltiples posiciones
    for (let i = 0; i < topScores.length; i++) {
      const scoreData = topScores[i];
      const userId = scoreData.userId || scoreData.id;
      const rank = i + 1;
      const reward = prizePool * rewardPercentages[i];

      if (reward > 0) {
        if (!userRewards[userId]) {
          userRewards[userId] = { totalReward: 0, ranks: [] };
        }
        userRewards[userId].totalReward += reward;
        userRewards[userId].ranks.push(rank);
      }
    }

    // 4. Repartir a los usuarios
    for (const [userId, data] of Object.entries(userRewards)) {
      const user = await dbAPI.getUserById(userId);
      if (user) {
        const newDeposit = (user.total_depositado || 0) + data.totalReward;
        const ranksString = data.ranks.join(', '); // e.g. "1, 3"
        
        await dbAPI.updateUser(userId, {
          total_depositado: newDeposit,
          pending_prize_amount: data.totalReward,
          pending_prize_rank: ranksString, // We store it as a string now
          high_score: 0
        });
        console.log(`🏆 Premio acumulado de ${data.totalReward.toFixed(4)} USDC asignado al usuario ${user.username} (Puestos: ${ranksString})`);
      }
    }
    
    // Limpiar todos los puntajes
    await dbAPI.clearAllScores();
    
    console.log('✅ Distribución de premios completada. Leaderboard reseteado.');
  } catch (error) {
    console.error('❌ Error distribuyendo premios:', error);
  }
}

export function startCron() {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  
  // Sincronizar el setTimeout para que se ejecute al finalizar la cuenta regresiva (Jueves 00:00 UTC)
  // El front end usa `Date.now() % WEEK_MS`. Esto asume que el ciclo termina en WEEK_MS - (Date.now() % WEEK_MS)
  const now = Date.now();
  const timeSinceLastReset = now % WEEK_MS;
  const timeLeft = WEEK_MS - timeSinceLastReset;
  
  console.log(`⏱️ Sincronizando Cron de premios. Primer disparo en ${Math.floor(timeLeft / (60 * 60 * 1000))} horas.`);
  
  setTimeout(() => {
    distributePrizes();
    // Luego de la primera ejecución, lo configuramos con setInterval cada 7 días
    setInterval(distributePrizes, WEEK_MS);
  }, timeLeft);
}
