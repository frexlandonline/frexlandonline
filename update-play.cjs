const fs = require('fs');
const path = require('path');

const playJsPath = path.join(__dirname, 'src/views/play.js');
let playJs = fs.readFileSync(playJsPath, 'utf8');

// Replace renderGameOverOverlay
const oldRender = /async function renderGameOverOverlay\(score, level, lines\) \{[\s\S]*?\}\n\}\n/m;

const newRender = `async function renderGameOverOverlay(score, level, lines) {
  const overlay = document.getElementById('game-overlay');
  if (!overlay) return;

  const user = getUser();
  const credits = user ? user.credits : 0;
  
  let saveSection = '';
  if (!user) {
    saveSection = \`<div style="font-size: 0.85rem; color: var(--neon-red); margin-top: 12px;">Debes iniciar sesión para guardar el puntaje.</div>\`;
  } else if (credits > 0) {
    saveSection = \`
      <div style="margin-top: 12px; padding: 12px; background: rgba(0, 245, 255, 0.05); border: 1px solid rgba(0, 245, 255, 0.2); border-radius: 8px;">
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Créditos disponibles: <strong style="color: var(--neon-cyan);">\${credits}</strong></div>
        <button class="btn btn-primary btn-md" id="btn-save-score" style="width: 100%; box-shadow: var(--shadow-glow-cyan);">
          💾 Guardar Puntaje (-1 Crédito)
        </button>
      </div>
    \`;
  } else {
    saveSection = \`
      <div style="margin-top: 12px; padding: 12px; background: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.2); border-radius: 8px;">
        <div style="font-size: 0.85rem; color: var(--neon-red); margin-bottom: 8px;">No tienes créditos suficientes.</div>
        <button class="btn btn-secondary btn-md" onclick="window.location.hash='#/wallet'" style="width: 100%;">
          💳 Recargar Créditos
        </button>
      </div>
    \`;
  }

  overlay.classList.remove('hidden');
  overlay.innerHTML = \`
    <div class="game-overlay-title" style="color: var(--neon-red);">Game Over</div>
    <div class="game-overlay-score">Puntaje: \${score.toLocaleString()}</div>
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Nivel \${level} • \${lines} líneas</div>
    
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 280px; margin: 0 auto;">
      <button class="btn btn-primary btn-lg" id="btn-restart">↻ Jugar de Nuevo</button>
      \${saveSection}
    </div>
  \`;

  document.getElementById('btn-restart')?.addEventListener('click', startGame);

  if (document.getElementById('btn-save-score')) {
    document.getElementById('btn-save-score').addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-score');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        const result = await api.post('/stats/score', { 
          score, 
          level, 
          linesCleared: lines, 
          duracionPartidaSegundos: Math.floor((Date.now() - gameStartTime) / 1000) 
        });
        updateLocalUser(result.user);
        showToast('Puntaje guardado exitosamente', 'success');
        btn.textContent = '✅ Guardado';
        btn.style.borderColor = 'var(--neon-green)';
        btn.style.color = 'var(--neon-green)';
      } catch (err) {
        console.error("Error guardando puntaje:", err);
        showToast(err.message || 'Error al guardar puntaje', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Reintentar Guardar';
      }
    });
  }
}
`;

playJs = playJs.replace(oldRender, newRender);

// Also remove WorldId imports to clean up
playJs = playJs.replace(/import \{ verifyHumanity \} from '\.\.\/web3\/worldId\.ts';/, '');
playJs = playJs.replace(/import \{ submitScoreToBlockchain, CONTRACT_ADDRESS \} from '\.\.\/web3\/contract\.ts';/, '');

fs.writeFileSync(playJsPath, playJs);
console.log('Updated play.js');
