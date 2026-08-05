export function showInfoModal() {
  const existing = document.getElementById('info-modal-backdrop');
  if (existing) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'info-modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal card-glass" style="max-width: 500px; border: 1px solid var(--neon-cyan); position: relative; padding: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-md); box-shadow: 0 0 20px rgba(0,245,255,0.2);">
      <button class="modal-close" id="info-modal-close">✕</button>
      <div class="modal-title text-gradient text-center" style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 700;">
        📘 Dinámica del Proyecto
      </div>
      
      <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; padding-right: 5px;">
        <p><strong>1. Pozo de Recompensas:</strong> El pozo se nutre de los intereses generados por los depósitos en protocolos DeFi (como Aave). El capital original se mantiene seguro mientras los intereses se sortean semanalmente.</p>
        <p><strong>2. Competencia:</strong> Juega y registra tus mejores puntajes. Usarás créditos para registrar puntajes en la Blockchain. (Obtienes 1 Crédito por cada 10 USDC depositados en el pozo de recompensas del proyecto).</p>
        <p><strong>3. Distribución:</strong> Al final de la semana, el 70% de los intereses generados se reparte entre los 3 mejores jugadores (50% al 1º, 35% al 2º, 15% al 3º). El 30% restante se destina al mantenimiento del proyecto.</p>
        <p><strong>4. Tus Fondos:</strong> Tú sigues teniendo control total. Puedes retirar tu saldo depositado en cualquier momento transcurrido el tiempo de bloqueo de seguridad.</p>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
        <input type="checkbox" id="info-modal-dont-show" style="cursor: pointer; width: 16px; height: 16px;">
        <label for="info-modal-dont-show" style="font-size: 0.85rem; color: var(--text-muted); cursor: pointer; user-select: none;">
          No volver a mostrar
        </label>
      </div>

      <button class="btn btn-primary btn-full" id="btn-info-understood" style="margin-top: 10px;">
        ¡Entendido!
      </button>
    </div>
  `;

  document.body.appendChild(backdrop);

  const closeModal = () => {
    const checkbox = document.getElementById('info-modal-dont-show');
    if (checkbox && checkbox.checked) {
      localStorage.setItem('blockdrop_hide_info', 'true');
    }
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  };

  document.getElementById('info-modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-info-understood').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
}
