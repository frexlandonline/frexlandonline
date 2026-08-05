import api from '../services/api.js';
import { getUser, updateLocalUser } from '../services/auth.js';

let modalInstance = null;

export function checkAndShowPrizeModal() {
  const user = getUser();
  if (!user || !user.pending_prize_amount || user.pending_prize_amount <= 0) {
    return;
  }

  // Si ya existe el modal, no lo duplicamos
  if (modalInstance) return;

  const rankStr = String(user.pending_prize_rank || '1');
  const amount = user.pending_prize_amount;
  
  let emoji = '🏅';
  if (rankStr.includes('1')) emoji = '🥇';
  else if (rankStr.includes('2')) emoji = '🥈';
  else if (rankStr.includes('3')) emoji = '🥉';
  
  const rankText = rankStr.includes(',') ? `Puestos #${rankStr}` : `Puesto #${rankStr}`;

  modalInstance = document.createElement('div');
  modalInstance.className = 'prize-modal-overlay';
  modalInstance.innerHTML = `
    <style>
      .prize-modal-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(10, 10, 26, 0.9);
        backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.5s ease-out;
      }
      .prize-modal-content {
        background: linear-gradient(145deg, rgba(30,30,50,0.9), rgba(15,15,25,0.95));
        border: 2px solid var(--neon-purple);
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 0 50px rgba(139, 92, 246, 0.5);
        position: relative;
        overflow: hidden;
        animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .prize-emoji {
        font-size: 5rem;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
      }
      .prize-title {
        font-family: var(--font-display);
        color: var(--neon-cyan);
        font-size: 1.8rem;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .prize-body {
        color: var(--text-primary);
        font-size: 1.1rem;
        line-height: 1.5;
        margin-bottom: 30px;
      }
      .prize-amount {
        color: var(--neon-green);
        font-weight: bold;
        font-size: 1.5rem;
      }
      .confetti {
        position: absolute; width: 10px; height: 10px; background: var(--neon-pink);
        animation: confetti-fall 3s linear infinite;
      }
      @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      @keyframes confetti-fall { 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; } 100% { transform: translateY(500px) rotate(720deg); opacity: 0; } }
    </style>
    
    <div class="prize-modal-content">
      <!-- Confetti elements -->
      ${Array.from({length: 15}).map((_, i) => `
        <div class="confetti" style="
          left: ${Math.random() * 100}%;
          background: ${['#00f5ff', '#ff3366', '#8b5cf6', '#39ff14'][Math.floor(Math.random() * 4)]};
          animation-delay: ${Math.random() * 2}s;
          animation-duration: ${2 + Math.random() * 2}s;
        "></div>
      `).join('')}
      
      <div class="prize-emoji">${emoji}</div>
      <div class="prize-title">¡Felicidades!</div>
      <div class="prize-body">
        Terminaste en los <strong>${rankText}</strong> esta semana.<br><br>
        Has ganado <span class="prize-amount">${amount.toFixed(2)} USDC</span><br><br>
        <span style="font-size: 0.9rem; color: var(--text-secondary);">El premio ha sido añadido a tu saldo depositado.</span>
      </div>
      <button id="btn-close-prize" class="btn btn-primary" style="width: 100%; font-family: var(--font-display); box-shadow: var(--shadow-glow-cyan);">
        ¡INCREÍBLE!
      </button>
    </div>
  `;

  document.body.appendChild(modalInstance);

  document.getElementById('btn-close-prize').addEventListener('click', async () => {
    modalInstance.remove();
    modalInstance = null;
    
    try {
      // Clear on backend
      await api.post('/admin/clear-prize');
      // Update local state
      user.pending_prize_amount = 0;
      user.pending_prize_rank = 0;
      updateLocalUser(user);
    } catch (e) {
      console.error('Failed to clear prize state', e);
    }
  });
}
