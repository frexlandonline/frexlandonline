const fs = require('fs');
const path = require('path');

const walletJsPath = path.join(__dirname, 'src/views/wallet.js');
let walletJs = fs.readFileSync(walletJsPath, 'utf8');

// 1. Add getTransactionHistory to imports
walletJs = walletJs.replace(/withdrawUSDC,\n  getUSDCBalance/, 'withdrawUSDC,\n  getUSDCBalance,\n  getTransactionHistory');

// 2. Add history to state
if (!walletJs.includes('history: []')) {
  walletJs = walletJs.replace(/loading: false/, "history: [],\n  loading: false");
}

// 3. Call getTransactionHistory
if (!walletJs.includes('getTransactionHistory(address)')) {
  walletJs = walletJs.replace(/walletState\.highScore = await getHighScoreFromChain\(address\);/, `walletState.highScore = await getHighScoreFromChain(address);\n        walletState.history = await getTransactionHistory(address);`);
}

// 4. Restore the UI logic
const oldDepositsUI = /<div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">\s*<div style="flex: 1; min-width: 200px;">/;

const newDepositsUI = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Saldo Depositado</span>
                    <div style="font-size: 1.2rem; font-weight: bold; margin-top: 4px; color: var(--neon-cyan);">
                      💰 \${parseFloat(currentUser?.total_depositado || 0).toFixed(2)} <span style="font-size: 0.8rem; color: var(--text-muted);">USDC</span>
                    </div>
                  </div>
                  
                  <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Créditos Disponibles</span>
                    <div style="font-size: 1.2rem; font-weight: bold; margin-top: 4px; color: var(--neon-green);">
                      🪙 \${currentUser?.creditos_escritura || 0}
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 200px;">`;

walletJs = walletJs.replace(oldDepositsUI, newDepositsUI);

const oldRetirarUI = /<button class="btn btn-secondary" id="btn-withdraw-base" style="height: 42px;">Solicitar Retiro<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*`}/;

const newRetirarUI = `<button class="btn btn-secondary" id="btn-withdraw-base" style="height: 42px;">Solicitar Retiro</button>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                  <h4 style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 12px; color: var(--text-primary);">📜 Historial de Transacciones</h4>
                  \${(walletState.history && walletState.history.length > 0) ? \`
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      \${walletState.history.map(tx => \`
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                          <div>
                            <div style="font-size: 0.85rem; font-weight: bold; color: \${tx.type === 'Depósito' ? 'var(--neon-green)' : 'var(--neon-purple)'};">
                              \${tx.type === 'Depósito' ? '📥' : '📤'} \${tx.type}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">\${new Date(tx.timestamp).toLocaleString()}</div>
                          </div>
                          <div style="text-align: right;">
                            <div style="font-size: 0.95rem; font-family: var(--font-display); color: var(--text-primary);">\${tx.amount.toFixed(2)} USDC</div>
                            <a href="https://sepolia.basescan.org/tx/\${tx.hash}" target="_blank" style="font-size: 0.7rem; color: var(--neon-cyan); text-decoration: none;">Ver tx ↗</a>
                          </div>
                        </div>
                      \`).join('')}
                    </div>
                  \` : \`
                    <div style="font-size: 0.85rem; color: var(--text-muted); padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px; text-align: center;">
                      No se encontraron transacciones en la blockchain para esta billetera.
                    </div>
                  \`}
                </div>
              \`}`;

walletJs = walletJs.replace(oldRetirarUI, newRetirarUI);

fs.writeFileSync(walletJsPath, walletJs);
console.log('Updated wallet.js with history UI');
