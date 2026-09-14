import api from '../services/api.js';
import { getUser } from '../services/auth.js';
import { getUserLevel, renderLevelBadge } from '../utils/levels.js';

let leaderboardData = [];

export async function fetchLeaderboard() {
  try {
    const data = await api.get('/scores/leaderboard?limit=10');
    leaderboardData = data.leaderboard || [];
    return leaderboardData;
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e);
    return [];
  }
}

export function renderLeaderboard(container) {
  const user = getUser();
  const userId = user?.id;

  let html = `
    <div class="card leaderboard-card">
      <div class="leaderboard-title">🏆 Mejores Puntajes</div>
      <div class="leaderboard-list" id="leaderboard-list">
  `;

  if (leaderboardData.length === 0) {
    html += `<div class="leaderboard-empty">Aún no hay puntajes. ¡Sé el primero!</div>`;
  } else {
    const top10 = leaderboardData.slice(0, 10);
    for (const entry of top10) {
      const isMe = entry.username === user?.username;
      const rankClass = entry.rank === 1 ? 'top-1' : entry.rank === 2 ? 'top-2' : entry.rank === 3 ? 'top-3' : '';
      const medal = entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
      const entryLevel = getUserLevel(entry.total_depositado || 0);
      html += `
        <div class="leaderboard-item ${isMe ? 'current-user' : ''}" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
            <span class="leaderboard-rank ${rankClass}">${medal || '#' + entry.rank}</span>
            <span class="leaderboard-name" style="font-weight: 600;">${entry.username}</span>
            ${renderLevelBadge(entryLevel, 'sm')}
          </div>
          <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
        </div>
      `;
    }
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

export async function refreshLeaderboard(container) {
  await fetchLeaderboard();
  renderLeaderboard(container);
}
