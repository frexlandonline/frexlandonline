import { t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { getUser, updateLocalUser, fetchCurrentUser } from '../services/auth.js';
import { showToast } from '../main.js';
import api from '../services/api.js';
import { renderFooter } from '../components/footer.js';
import { getPendingScore } from '../services/gameSession.js';
import { getWalletClient } from '../web3/contract.ts';
import { isLemonWebView, depositLemon, withdrawLemon } from '../web3/lemon.js';
import { isWorldAppWebView, payWorld } from '../web3/world.ts';
import { bridgeUSDCToBase } from '../web3/cctp.ts';
import { verifyHumanity } from '../web3/worldId.ts';

// Modern Web3 EVM imports from Agent 3 TypeScript module
import { 
  connectWallet, 
  disconnectWallet, 
  getConnectedAddress, 
  subscribeToAccountChanges 
} from '../web3/wallet.ts';

import { 
  getRewardTokenBalance, 
  depositTokens, 
  CONTRACT_ADDRESS,
  getPublicClient,
  approveUSDC,
  depositUSDC,
  withdrawUSDC,
  getUSDCBalance,
  getTransactionHistory,
  checkUSDCAllowance,
  getUserDepositedBalance
} from '../web3/contract.ts';

import { formatEther, parseEther } from 'viem';

function getNetworkDetails(chainId) {
  switch (chainId) {
    case 8453: return { name: 'Base', symbol: 'ETH' };
    case 1: return { name: 'Ethereum Mainnet', symbol: 'ETH' };
    case 10: return { name: 'Optimism L2', symbol: 'ETH' };
    case 42161: return { name: 'Arbitrum L2', symbol: 'ETH' };
    case 137: return { name: 'Polygon PoS', symbol: 'POL' };
    case 480: return { name: 'World Chain', symbol: 'WLD' };
    default: return { name: `Red Desconocida (Chain ID: ${chainId || 'Desconocido'})`, symbol: 'ETH' };
  }
}

function formatBalance(val) {
  const num = parseFloat(val || 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(num);
}

let isSubscribed = false;
let walletState = {
  address: null,
  chain: 'ethereum', // 'ethereum' | 'solana'
  chainId: null,
  networkName: 'Ethereum/EVM',
  nativeSymbol: 'ETH',
  ethBalance: '0.0000',
  solBalance: '0.0000',
  tokenBalance: '0.0000',
  highScore: 0,
  history: [],
  loading: false
};

export function renderWalletPage(container) {
  const currentUser = getUser();

  container.innerHTML = `
    <div id="navbar-container"></div>
    <div class="wallet-page">
      <div class="wallet-content" id="wallet-content"></div>
    </div>
  `;

  renderNavbar(document.getElementById('navbar-container'), 'wallet');
  
  // Set initial active address
  const activeAddress = getConnectedAddress();
  if (isWorldAppWebView() || (currentUser && currentUser.wallets && currentUser.wallets.worldchain) || currentUser?.platform === 'worldchain') {
    walletState.address = currentUser?.wallets?.worldchain || activeAddress || (currentUser?.wallets ? Object.values(currentUser.wallets)[0] : null);
    walletState.chain = 'worldchain';
    walletState.networkName = 'World Chain';
    walletState.nativeSymbol = 'WLD';
    walletState.chainId = 480; // World Chain ID
  } else if (activeAddress) {
    walletState.address = activeAddress;
    walletState.chain = 'ethereum';
  } else if (currentUser && currentUser.wallets && currentUser.wallets.ethereum) {
    walletState.address = currentUser.wallets.ethereum;
    walletState.chain = 'ethereum';
  }

  // Reactive subscription to EVM account changes (WAGMI)
  if (!isSubscribed) {
    subscribeToAccountChanges(async (account) => {
      console.log("Web3 Account change detected:", account);
      const user = getUser();
      const isWorld = account.chainId === 480 || isWorldAppWebView() || user?.platform === 'worldchain' || (user?.wallets && user.wallets.worldchain);

      if (account.isConnected && account.address) {
        // If we connected an EVM wallet, update active state
        walletState.address = account.address;
        walletState.chain = isWorld ? 'worldchain' : 'ethereum';
        walletState.chainId = isWorld ? 480 : (account.chainId || 8453);
        const net = getNetworkDetails(walletState.chainId);
        walletState.networkName = net.name;
        walletState.nativeSymbol = net.symbol;
        
        await loadWeb3Data(account.address);
      } else {
        // Only clear active if it was an ethereum wallet and not world app
        if (walletState.chain === 'ethereum' && !isWorld) {
          walletState.address = null;
        }
      }
      renderWalletContent();
    });
    isSubscribed = true;
  }

  renderWalletContent();
  renderFooter(container.querySelector('.wallet-page'));
  
  if (walletState.address) {
    loadWeb3Data(walletState.address);
  } else {
    fetchCurrentUser().then(u => {
      if (u) {
        const isWorld = isWorldAppWebView() || u.platform === 'worldchain' || (u.wallets && u.wallets.worldchain);
        if (isWorld) {
          walletState.address = u.wallets?.worldchain || (u.wallets ? Object.values(u.wallets)[0] : null);
          walletState.chain = 'worldchain';
          walletState.networkName = 'World Chain';
          walletState.nativeSymbol = 'WLD';
          walletState.chainId = 480;
        } else if (u.wallets && u.wallets.ethereum) {
          walletState.address = u.wallets.ethereum;
          walletState.chain = 'ethereum';
        }
        if (walletState.address) {
          loadWeb3Data(walletState.address);
        }
      }
    }).catch(console.warn);
  }
}

function renderWalletContent() {
  const content = document.getElementById('wallet-content');
  if (!content) return;

  if (!walletState.address) {
    content.innerHTML = `
      <div class="card wallet-connect-card" style="border: 1px solid var(--border-color); background: var(--bg-card); border-radius: var(--radius-lg); box-shadow: 0 0 30px rgba(0, 245, 255, 0.05);">
        <div class="wallet-connect-icon" style="filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.3));">🌐</div>
        <h2 class="text-gradient" style="font-family: var(--font-display); font-size: 1.8rem; margin-bottom: 8px;">${t('walletConnect')}</h2>
        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 24px auto; font-size: 0.95rem; line-height: 1.5;">
          ${t('walletConnectDesc')}
        </p>
        <button class="btn btn-primary btn-lg" id="btn-connect-wallet" style="box-shadow: var(--shadow-glow-cyan); margin-bottom: var(--space-md);">
          ${t('walletConnectBtn')}
        </button>
        
        ${renderLinkedWalletsSection(false)}
      </div>
    `;
    
    document.getElementById('btn-connect-wallet')?.addEventListener('click', () => {
      connectWallet().catch(err => showToast(err.message || 'Error al conectar', 'error'));
    });
  } else {
    const isPlaceholderContract = CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' || walletState.chainId !== 8453;
    const activeChainName = walletState.chain === 'solana' ? 'Solana Mainnet' : walletState.networkName;
    const nativeSymbol = walletState.chain === 'solana' ? 'SOL' : 'ETH';
    const nativeBalance = walletState.chain === 'solana' ? walletState.solBalance : walletState.ethBalance;

    // Check if currently connected active wallet is linked to user account
    const currentUser = getUser();
    const linkedWallets = currentUser?.wallets || {};
    const isAlreadyLinked = Object.values(linkedWallets).some(
      addr => addr && addr.toLowerCase() === walletState.address.toLowerCase()
    );

    content.innerHTML = `
      <div class="wallet-header">
        <h1 class="text-gradient" style="font-family: var(--font-display); font-size: 2.2rem; margin-bottom: 8px;">💎 Billetera Activa</h1>
        <div class="wallet-address-display">
          <span class="wallet-address-text" id="wallet-addr" style="font-family: monospace; font-size: 0.9rem; color: var(--neon-cyan); letter-spacing: 0.5px;">
            ${walletState.address}
          </span>
          <button class="wallet-copy-btn" id="btn-copy" title="Copiar ${t('walletAddress')}" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted);">📋</button>
        </div>
        <div style="margin-top: 12px; display: flex; gap: var(--space-sm); justify-content: center; align-items: center; flex-wrap: wrap;">
          <span class="wallet-network-badge" style="background: rgba(0, 245, 255, 0.1); border-color: rgba(0, 245, 255, 0.3); color: var(--neon-cyan); font-weight: 600; margin-top: 0;">
            🌐 ${activeChainName}
          </span>
          ${!isAlreadyLinked ? `
            <button class="btn btn-sm btn-primary" id="btn-link-active-wallet" style="font-size: 0.75rem; padding: 4px 10px; box-shadow: var(--shadow-neon-purple); background: var(--gradient-secondary);">
              🔗 ${t('walletBtnLink')}
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--neon-green); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ✅ Vinculada a tu cuenta
            </span>
          `}
        </div>
      </div>

      ${walletState.loading ? `
        <div style="text-align: center; padding: 40px;">
          <div class="spinner" style="margin: 0 auto;"></div>
          <p style="margin-top: 16px; color: var(--text-secondary); font-size: 0.95rem;">Consultando balances de la blockchain...</p>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 24px;">
          
          <!-- SECCIÓN DE BALANCES DE RED -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-md);">
              <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Saldo USDC (${walletState.chain === 'worldchain' ? 'World Chain' : 'Base'})</span>
              <div style="font-family: var(--font-display); font-size: 1.8rem; color: var(--neon-cyan); margin: 8px 0;">
                💎 ${formatBalance(walletState.tokenBalance || 0)} <span style="font-size: 1rem; font-family: var(--font-ui); color: var(--text-secondary);">USDC</span>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${t('walletBalance')}</span>
            </div>
          </div>

          <!-- SECCIÓN DE DEPÓSITOS Y CRÉDITOS -->
          ${(walletState.chain === 'ethereum' || isLemonWebView() || walletState.chain === 'worldchain' || isWorldAppWebView()) ? `
            <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-md);">
              <h3 style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 8px;">📥 Depósitos para Créditos</h3>
              <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px; line-height: 1.4;">
                ${walletState.chain === 'worldchain' ? 'Operando en la red <strong>World Chain</strong>. Deposita USDC para obtener créditos. (10 USDC = 1 Crédito).' : 'La red oficial del juego es <strong>Base</strong>. Deposita USDC para obtener créditos. (10 USDC = 1 Crédito). El registro de tu récord consume 1 crédito.'}
              </p>
              
              ${isLemonWebView() ? `
                <!-- LEMON CASH INTEGRATION TABS -->
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                  <button class="btn btn-primary" id="lemon-tab-crypto" style="flex: 1;" onclick="document.getElementById('lemon-fiat-disclaimer').style.display='none'; document.getElementById('lemon-deposit-section').style.display='block';">Operar en Cripto (USDC)</button>
                  <button class="btn btn-secondary" id="lemon-tab-fiat" style="flex: 1;" onclick="document.getElementById('lemon-fiat-disclaimer').style.display='block'; document.getElementById('lemon-deposit-section').style.display='block';">Operar en Fiat (ARS)</button>
                </div>
                
                <div id="lemon-fiat-disclaimer" style="display: none; padding: 12px; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: var(--radius-sm); color: #FFA500; font-size: 0.85rem; text-align: center; margin-bottom: 15px;">
                  ⚠️ <strong>Aviso Legal:</strong> El proyecto recibe únicamente USDC. Al depositar en ARS, estás utilizando un servicio de terceros para la conversión. FrexLand no se responsabiliza por pérdidas derivadas del tipo de cambio.
                </div>
              ` : ''}

              ${(!isLemonWebView() && !isWorldAppWebView() && walletState.chain === 'ethereum' && walletState.chainId !== 8453) ? `
                <div style="padding: 12px; background: rgba(255, 51, 102, 0.1); border: 1px solid rgba(255, 51, 102, 0.3); border-radius: var(--radius-sm); color: var(--neon-red); font-size: 0.85rem; text-align: center;">
                  ⚠️ Estás en una red incorrecta. Por favor, cambia a la red Base para depositar.
                  <button id="btn-connect-evm" class="btn-primary" style="margin:0 auto; display:block;">Conectar MetaMask / Injected</button>
                </div>
              ` : `
                <div id="lemon-deposit-section">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                    <div style="background: rgba(255,255,255,0.02); padding: 10px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
                      <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Saldo Depositado</span>
                      <div style="font-size: clamp(0.95rem, 3.5vw, 1.2rem); font-weight: bold; margin-top: 2px; color: var(--neon-cyan); word-break: break-all;">
                        💰 ${formatBalance(currentUser?.total_depositado || 0)} <span style="font-size: 0.72rem; color: var(--text-muted);">USDC</span>
                      </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.02); padding: 10px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
                      <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Créditos Disponibles</span>
                      <div style="font-size: clamp(0.95rem, 3.5vw, 1.2rem); font-weight: bold; margin-top: 2px; color: var(--neon-green);">
                        🪙 ${currentUser?.creditos_escritura || 0}
                      </div>
                    </div>
                  </div>

                  ${currentUser ? `
                    <div class="card" style="background: radial-gradient(circle at top left, rgba(139, 92, 246, 0.15) 0%, rgba(10, 10, 26, 0.8) 100%); border: 1px solid var(--neon-purple); padding: 14px 12px; border-radius: var(--radius-md); margin-bottom: 20px; box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); box-sizing: border-box;">
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 1.5rem;">🌍</span>
                          <div>
                            <h4 style="margin: 0; font-family: var(--font-display); font-size: clamp(0.85rem, 3.5vw, 1.05rem); color: var(--neon-cyan);">Verificación de Humanidad (World ID)</h4>
                            <span style="font-size: 0.7rem; color: var(--text-muted);">Prueba de persona única libre de bots</span>
                          </div>
                        </div>
                        ${currentUser.isWorldIdVerified ? `
                          <span style="font-size: 0.75rem; background: rgba(57, 255, 20, 0.1); border: 1px solid var(--neon-green); color: var(--neon-green); padding: 3px 8px; border-radius: 20px; font-weight: bold;">
                            ✅ Humano Verificado
                          </span>
                        ` : ''}
                      </div>

                      ${currentUser.isWorldIdVerified ? `
                        <div style="background: rgba(57, 255, 20, 0.05); border: 1px dashed rgba(57, 255, 20, 0.3); padding: 10px; border-radius: 8px; color: var(--text-primary); font-size: 0.8rem; line-height: 1.4;">
                          🎉 <strong>¡Tu cuenta está verificada!</strong> Ya has recibido tu crédito extra por verificar tu humanidad con World ID.
                        </div>
                      ` : `
                        <div style="color: var(--text-secondary); font-size: 0.8rem; line-height: 1.4; margin-bottom: 12px;">
                          🛡️ <strong>Beneficio Exclusivo:</strong> Si ya tienes <strong>al menos 1 crédito disponible</strong>, verificar que eres humano con World ID te otorgará <strong>+1 crédito extra de regalo</strong> para registrar tus mejores puntajes.
                        </div>

                        ${(currentUser?.creditos_escritura || 0) >= 1 ? `
                          <div style="margin-bottom: 12px; font-size: 0.78rem; color: var(--neon-green); display: flex; align-items: center; gap: 6px;">
                            <span>✨</span> Cumples el requisito (${currentUser.creditos_escritura} créditos disponibles). ¡Verifica tu humanidad ahora y suma +1 crédito extra!
                          </div>
                        ` : `
                          <div style="margin-bottom: 12px; font-size: 0.78rem; color: #FFA500; background: rgba(255, 165, 0, 0.08); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255, 165, 0, 0.2); line-height: 1.35;">
                            ⚠️ Actualmente tienes 0 créditos. Realiza un depósito (mín. 10 USDC) para obtener tu primer crédito y desbloquear el crédito extra por verificación de humano.
                          </div>
                        `}

                        <button class="btn btn-primary" id="btn-verify-worldid" style="width: 100%; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); background: linear-gradient(135deg, #8b5cf6 0%, #00f5ff 100%); border: none; font-weight: bold; font-family: var(--font-display); font-size: clamp(0.75rem, 2.8vw, 0.9rem); padding: 12px 8px; white-space: normal; line-height: 1.3;">
                          🛡️ Verificar que soy humano (+1 Crédito Extra)
                        </button>
                      `}
                    </div>
                  ` : ''}

                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 140px;">
                    <input type="number" id="deposit-amount" class="form-input" placeholder="Monto (mín. 10 USDC)" min="10" step="10" style="width: 100%; height: 40px; font-family: var(--font-display); font-size: 0.85rem; padding: 6px 10px; box-sizing: border-box;">
                  </div>
                  <div style="display: flex; gap: 6px; flex-shrink: 0;">
                    <button class="btn btn-primary" id="btn-deposit-base" style="height: 40px; padding: 0 16px; font-size: 0.85rem; box-shadow: var(--shadow-glow-cyan);">Depositar</button>
                  </div>
                </div>

                <div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                  <h4 style="font-family: var(--font-display); font-size: 0.95rem; margin-bottom: 10px; color: var(--text-primary);">📤 Retirar Fondos</h4>
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 140px;">
                      <input type="number" id="withdraw-amount" class="form-input" placeholder="Monto a retirar" min="10" step="10" style="width: 100%; height: 40px; font-family: var(--font-display); font-size: 0.85rem; padding: 6px 10px; box-sizing: border-box;" ${currentUser?.withdraw_request_time ? `value="${currentUser.withdraw_request_amount}" disabled` : ''}>
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0;">
                      <button class="btn btn-secondary" id="btn-withdraw-base" style="height: 40px; padding: 0 14px; font-size: 0.85rem;">
                        ${currentUser?.withdraw_request_time ? 'Retiro en proceso (24hs)' : 'Solicitar Retiro'}
                      </button>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                  <h4 style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 12px; color: var(--text-primary);">📜 Historial de Transacciones</h4>
                  
                  ${walletState.historyNeedsRecovery ? `
                    <div style="font-size: 0.85rem; color: var(--text-muted); padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px; text-align: center; margin-bottom: 12px;">
                      No hay historial local para esta billetera.
                      <div style="margin-top: 10px;">
                        <button class="btn btn-primary btn-sm" id="btn-recover-history">🔍 Buscar en la red (últimos 3 días)</button>
                      </div>
                    </div>
                  ` : ''}

                  ${(walletState.history && walletState.history.length > 0) ? `
                    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 5px;">
                      ${walletState.history.map(tx => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                          <div>
                            <div style="font-size: 0.85rem; font-weight: bold; color: ${tx.type === 'Depósito' ? 'var(--neon-green)' : 'var(--neon-purple)'};">
                              ${tx.type === 'Depósito' ? '📥' : '📤'} ${tx.type}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${new Date(tx.timestamp).toLocaleString()}</div>
                          </div>
                          <div style="text-align: right;">
                            <div style="font-size: 0.95rem; font-family: var(--font-display); color: var(--text-primary);">${formatBalance(tx.amount)} USDC</div>
                            <a href="https://basescan.org/tx/${tx.hash}" target="_blank" style="font-size: 0.7rem; color: var(--neon-cyan); text-decoration: none;">Ver tx ↗</a>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div style="font-size: 0.85rem; color: var(--text-muted); padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px; text-align: center;">
                      No se encontraron transacciones en la blockchain para esta billetera.
                    </div>
                  `}
                </div>
              `}
            </div>
          ` : ''}

          <!-- SECCIÓN DE PERFIL Y VINCULACIONES -->
          ${renderLinkedWalletsSection(true)}

          <!-- BOTONES DE CONTROL DE SESIÓN -->
          <div style="text-align: center; margin-top: 20px; display: flex; justify-content: center; gap: 12px;">
            <button class="btn btn-secondary btn-sm" id="btn-refresh-wallet">↻ Actualizar Datos</button>
            <button class="btn btn-secondary btn-sm" id="btn-disconnect" style="color: var(--neon-red); border-color: rgba(255, 51, 102, 0.2); background: rgba(255, 51, 102, 0.02);">
              🛑 ${t('walletBtnDisconnect')}
            </button>
          </div>
        </div>
      `}
    `;

    document.getElementById('btn-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(walletState.address);
      showToast(`${t('walletAddress')} copiada`, 'success');
    });

    document.getElementById('btn-refresh-wallet')?.addEventListener('click', () => loadWeb3Data(walletState.address));
    document.getElementById('btn-disconnect')?.addEventListener('click', handleDisconnect);
    document.getElementById('btn-link-active-wallet')?.addEventListener('click', handleLinkActiveWallet);

    document.getElementById('btn-verify-worldid')?.addEventListener('click', async () => {
      const currentUser = getUser();
      const credits = currentUser?.creditos_escritura || 0;
      if (credits < 1) {
        showToast('Necesitas tener al menos 1 crédito disponible para recibir el crédito extra al verificar.', 'warning');
        return;
      }

      const btn = document.getElementById('btn-verify-worldid');
      if (!btn) return;
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Verificando...';
      btn.disabled = true;

      try {
        const address = walletState.address || currentUser?.wallets?.worldchain || '0x0000000000000000000000000000000000000000';
        const proof = await verifyHumanity(address);
        
        const res = await api.post('/auth/world/verify', {
          proof: proof.proof,
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          action: 'auth',
          signal: address,
          userId: currentUser.id
        });

        if (res.success) {
          showToast('¡Verificación exitosa! Se te ha asignado +1 crédito extra.', 'success');
          updateLocalUser(res.user);
          renderWalletContent();
        } else {
          showToast('La verificación no pudo completarse.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Error al verificar con World ID', 'error');
      } finally {
        const freshBtn = document.getElementById('btn-verify-worldid');
        if (freshBtn) {
          freshBtn.innerHTML = originalText;
          freshBtn.disabled = false;
        }
      }
    });

    document.getElementById('btn-recover-history')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-recover-history');
      if(btn) { btn.textContent = 'Buscando...'; btn.disabled = true; }
      try {
        const newTxs = await getTransactionHistory(walletState.address);
        const existing = walletState.history || [];
        const map = new Map();
        existing.forEach(t => map.set(t.hash, t));
        newTxs.forEach(t => map.set(t.hash, t));
        walletState.history = Array.from(map.values()).sort((a,b) => b.timestamp - a.timestamp);
        walletState.historyNeedsRecovery = false;
        localStorage.setItem(`tx_history_${walletState.address.toLowerCase()}`, JSON.stringify(walletState.history));
        showToast('Historial recuperado desde la red.', 'success');
      } catch(e) {
        console.error(e);
        showToast('Error al buscar historial.', 'error');
      } finally {
        renderWalletContent();
      }
    });

    // Deposit and Withdraw on Base / World Chain network
    if (walletState.chain === 'ethereum' || walletState.chain === 'worldchain' || isLemonWebView() || isWorldAppWebView()) {
      if (walletState.chainId === 8453 || walletState.chain === 'worldchain' || isLemonWebView() || isWorldAppWebView()) {
        document.getElementById('btn-deposit-base')?.addEventListener('click', handleDepositBase);
        document.getElementById('btn-withdraw-base')?.addEventListener('click', handleWithdrawBaseClick);
      } else {
        document.getElementById('btn-switch-base')?.addEventListener('click', handleSwitchToBase);
        document.getElementById('btn-connect-evm')?.addEventListener('click', () => connectWallet().catch(err => {
          showToast('Error abriendo modal de conexión', 'error');
        }));
      }
    }
  }
}

// Function to render profile linked wallets list
function renderLinkedWalletsSection(isUserConnected) {
  const currentUser = getUser();
  const linkedWallets = currentUser?.wallets || {};
  const walletListHtml = Object.entries(linkedWallets).map(([chain, address]) => {
    const chainLabel = chain === 'ethereum' ? '🦊 Ethereum/EVM' : chain === 'solana' ? '👻 Solana' : chain;
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <div style="text-align: left;">
          <div style="font-size: 0.8rem; font-weight: bold; color: var(--neon-cyan);">${chainLabel}</div>
          <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">${address}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-md); text-align: left;">
      <h3 style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        🔗 ${t('walletLinked')}
      </h3>
      ${walletListHtml ? `
        <div style="display: flex; flex-direction: column;">
          ${walletListHtml}
        </div>
      ` : `
        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">No tienes ninguna billetera vinculada a tu perfil de usuario.</p>
      `}
    </div>
  `;
}

async function loadWeb3Data(address) {
  if (!address) return;
  
  walletState.loading = true;
  renderWalletContent();

  try {
    let freshUser = null;
    try {
      freshUser = await fetchCurrentUser();
    } catch (e) {
      console.warn("Failed to fetch fresh user data", e);
    }
    const currentUser = freshUser || getUser();

    const isWorld = walletState.chain === 'worldchain' || 
                    walletState.chainId === 480 || 
                    isWorldAppWebView() || 
                    currentUser?.platform === 'worldchain' ||
                    Boolean(currentUser?.wallets?.worldchain && currentUser.wallets.worldchain.toLowerCase() === address.toLowerCase());

    if (walletState.chain === 'solana') {
      // Fetch SOL balance directly via public RPC
      const rpcRes = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      const rpcData = await rpcRes.json();
      const lamports = rpcData.result?.value || 0;
      walletState.solBalance = (lamports / 1e9).toFixed(4);
      walletState.ethBalance = '0.0000';
      walletState.tokenBalance = '0.0000';
    } else if (isWorld) {
      walletState.chain = 'worldchain';
      walletState.chainId = 480;
      walletState.networkName = 'World Chain';
      walletState.nativeSymbol = 'WLD';
      walletState.ethBalance = '0.0000';
      try {
        const usdcBal = await getUSDCBalance(address, 480);
        walletState.tokenBalance = usdcBal;
      } catch (e) {
        console.error("Error fetching World Chain USDC balance:", e);
        walletState.tokenBalance = '0.00';
      }
    } else {
      // Fetch EVM balance
      let chainId = 8453; // Default to Base
      if (window.ethereum) {
        try {
          const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
          chainId = parseInt(hexChainId, 16);
          walletState.chainId = chainId;

          const net = getNetworkDetails(chainId);
          walletState.networkName = net.name;
          walletState.nativeSymbol = net.symbol;

          const hexBalance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          });
          const balanceWei = BigInt(hexBalance);
          walletState.ethBalance = formatEther(balanceWei);
        } catch (ethErr) {
          console.error("Error fetching balance/chain via window.ethereum:", ethErr);
          const publicClient = getPublicClient();
          const balance = await publicClient.getBalance({ address });
          walletState.ethBalance = formatEther(balance);
          walletState.chainId = 8453;
          walletState.networkName = 'Base';
          walletState.nativeSymbol = 'ETH';
        }
      } else {
        const publicClient = getPublicClient();
        const balance = await publicClient.getBalance({ address });
        walletState.ethBalance = formatEther(balance);
        walletState.chainId = 8453;
        walletState.networkName = 'Base';
        walletState.nativeSymbol = 'ETH';
      }

      try {
        const usdcBal = await getUSDCBalance(address, walletState.chainId);
        walletState.tokenBalance = usdcBal;
      } catch (e) {
        console.error("Failed to get USDC balance", e);
        walletState.tokenBalance = '0.00';
      }

      if (walletState.chainId === 8453) {
        try {
          const onChainDeposit = await getUserDepositedBalance(address);
          const user = getUser();
          if (user && onChainDeposit > (user.total_depositado || 0)) {
            const res = await api.post('/wallet/sync-deposit', { amount: onChainDeposit });
            if (res.synced && res.user) {
              updateLocalUser(res.user);
            }
          }
        } catch(e) {
          console.error('Error syncing deposit:', e);
        }
      }

      // Fetch contract stats (if not placeholder AND on Base)
      if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' && walletState.chainId === 8453) {
        // High score and history are managed by backend now, not on-chain
        walletState.highScore = 0;
        try {
          const localStr = localStorage.getItem(`tx_history_${address.toLowerCase()}`);
          if (localStr) {
            walletState.history = JSON.parse(localStr);
            walletState.historyNeedsRecovery = false;
          } else {
            walletState.history = [];
            walletState.historyNeedsRecovery = true;
          }
        } catch (e) {
          walletState.history = [];
          walletState.historyNeedsRecovery = true;
        }
      } else {
        walletState.highScore = 0;
      }
    }
  } catch (err) {
    console.error("Error loading web3 data:", err);
    showToast("Error al obtener balances de la blockchain", "error");
  } finally {
    walletState.loading = false;
    renderWalletContent();
  }
}

async function handleSwitchToBase() {
  if (!window.ethereum) return showToast('No Ethereum provider found', 'error');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }], // 8453 in hex
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x2105',
              chainName: 'Base',
              rpcUrls: ['https://mainnet.base.org'] /* ... */,
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://basescan.org']
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding Base chain', addError);
        showToast('Error al añadir la red Base', 'error');
      }
    } else {
      console.error('Error switching chain', switchError);
      showToast('Error al cambiar a la red Base', 'error');
    }
  }
}

async function handleDepositBase() {
  const input = document.getElementById('deposit-amount');
  const amountStr = input ? input.value : '0';
  const amount = parseFloat(amountStr);

  if (!amount || amount < 10 || amount % 10 !== 0) {
    showToast('El monto mínimo es 10 USDC y debe ser múltiplo de 10.', 'error');
    return;
  }
  
  const currentUser = getUser();
  const btn = document.getElementById('btn-deposit-base');
  const originalText = btn.textContent;
  
  if (isLemonWebView()) {
    btn.textContent = 'Procesando en Lemon...';
    btn.disabled = true;
    try {
      const isFiat = document.getElementById('lemon-fiat-disclaimer')?.style.display === 'block';
      const tokenName = isFiat ? 'ARS' : 'USDC';
      
      const txHash = await depositLemon(amount, tokenName);
      
      const result = await api.post('/wallet/deposit', { amount });
      updateLocalUser(result.user);
      
      showToast('Depósito con Lemon exitoso. Créditos actualizados.', 'success');
      input.value = '';
      renderWalletContent();
    } catch (error) {
      console.error("Lemon Deposit error:", error);
      showToast(error.shortMessage || error.message || 'Falló el depósito en Lemon', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    return;
  }

  if (isWorldAppWebView() || walletState.chain === 'worldchain' || currentUser?.platform === 'worldchain') {
    btn.textContent = 'Procesando en World App...';
    btn.disabled = true;
    try {
      const address = walletState.address || getConnectedAddress() || currentUser?.wallets?.worldchain;
      if (!address) throw new Error("Wallet de World App no encontrada");

      let txHash = null;
      try {
        btn.textContent = 'Confirmando en World App...';
        const payRes = await payWorld(amount);
        txHash = payRes.transactionId;
      } catch (payErr) {
        console.warn("MiniKit.pay fallback to CCTP bridge:", payErr);
        if (payErr.message && payErr.message.includes('cancelado')) {
          throw payErr;
        }
        const amountWei = BigInt(amount * 1e6); // 6 decimals
        await bridgeUSDCToBase(amountWei, address, (step) => {
          btn.textContent = step;
        });
      }

      const result = await api.post('/wallet/deposit', { amount, platform: 'worldchain', txHash });
      updateLocalUser(result.user);
      
      showToast('Depósito vía World Chain exitoso. Créditos actualizados.', 'success');
      input.value = '';
      renderWalletContent();
    } catch (error) {
      console.error("World Chain Deposit error:", error);
      showToast(error.shortMessage || error.message || 'Falló el depósito vía World Chain', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    return;
  }

  btn.textContent = 'Aprobando USDC...';
  btn.disabled = true;

  try {
    const amountWei = BigInt(amount * 1e6); // USDC has 6 decimals
    
    // Check existing allowance first
    const address = getConnectedAddress();
    const hasAllowance = await checkUSDCAllowance(address, amountWei);
    
    if (!hasAllowance) {
      // 1. Approve USDC if no allowance
      await approveUSDC(amountWei);
      showToast('Aprobación exitosa. Esperando sincronización de red...', 'info');
      // Wait 3 seconds for the RPC node to sync the state on Base L2 before simulating the next TX
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    btn.textContent = 'Depositando...';
    
    // 2. Deposit into Smart Contract
    const txHash = await depositUSDC(amountWei);

    if (walletState.address) {
      const existing = walletState.history || [];
      existing.unshift({ type: 'Depósito', amount, hash: txHash, timestamp: Date.now(), blockNumber: 999999999 });
      walletState.history = existing;
      walletState.historyNeedsRecovery = false;
      localStorage.setItem(`tx_history_${walletState.address.toLowerCase()}`, JSON.stringify(existing));
    }

    // 3. Update backend credits
    const result = await api.post('/wallet/deposit', { amount });
    updateLocalUser(result.user);
    
    showToast('Depósito on-chain exitoso. Créditos actualizados.', 'success');
    input.value = '';
    renderWalletContent();
  } catch (error) {
    console.error("Deposit error:", error);
    showToast(error.shortMessage || error.message || 'Falló el depósito', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

let withdrawTimer = null;
let withdrawReady = false;

function handleWithdrawBaseClick() {
  const input = document.getElementById('withdraw-amount');
  const btn = document.getElementById('btn-withdraw-base');
  const amount = parseFloat(input ? input.value : '0');

  if (!amount || amount <= 0) {
    return showToast('Monto inválido para retirar.', 'error');
  }

  const currentUser = getUser();
  const currentTotal = currentUser?.total_depositado || 0;

  if (amount > currentTotal) {
    return showToast('No puedes retirar más del saldo que tienes depositado.', 'error');
  }

  const ADMIN_WALLET = '0x7ca7022c3Ed27534192A2379a5eDd0252b3f6E65'.toLowerCase();
  const isOwner = Object.values(currentUser?.wallets || {}).some(addr => addr && addr.toLowerCase() === ADMIN_WALLET);

  if (isOwner) {
    executeWithdraw(amount, true);
    return;
  }

  // Bypass 24h wait if using Lemon Cash mini app
  if (isLemonWebView()) {
    executeWithdraw(amount, false);
    return;
  }
  
  if (isWorldAppWebView()) {
    // También procesaremos el retiro a través de un request normal o directamente según la lógica.
    // Asumiremos que el backend requiere las 24h, o bypass si se decide. Para mantener seguridad, hacemos el flujo estándar.
    // Si queremos bypass como Lemon:
    // executeWithdraw(amount, false);
    // return;
  }

  // Comprobar si ya tiene una solicitud
  if (currentUser.withdraw_request_time && currentUser.withdraw_request_amount === amount) {
    const requestTime = new Date(currentUser.withdraw_request_time).getTime();
    const now = Date.now();
    const waitTime = 24 * 60 * 60 * 1000;
    
    if (now - requestTime < waitTime) {
      const remainingMs = waitTime - (now - requestTime);
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      showToast(`Debes esperar 24 horas. Faltan ${remainingHours}h y ${remainingMinutes}m`, 'warning');
      return;
    } else {
      executeWithdraw(amount, false);
      return;
    }
  }

  // Solicitar nuevo retiro
  btn.disabled = true;
  btn.textContent = 'Solicitando...';
  
  api.post('/wallet/request-withdraw', { amount }).then(res => {
    updateLocalUser(res.user);
    showToast(res.message, 'success');
    btn.textContent = 'Retiro en 24hs';
  }).catch(err => {
    showToast(err.message || 'Error al solicitar retiro', 'error');
    btn.disabled = false;
    btn.textContent = 'Solicitar Retiro';
  });
}

async function executeWithdraw(amount, isAdmin) {
  const btn = document.getElementById('btn-withdraw-base');
  const input = document.getElementById('withdraw-amount');
  
  btn.textContent = 'Retirando on-chain...';
  btn.disabled = true;

  try {
    let txHash;
    if (isLemonWebView()) {
      const isFiat = document.getElementById('lemon-fiat-disclaimer')?.style.display === 'block';
      const tokenName = isFiat ? 'ARS' : 'USDC';
      txHash = await withdrawLemon(amount, tokenName);
    } else if (isWorldAppWebView()) {
      // Para World App, el backend orquesta el CCTP reverse bridge
      const result = await api.post('/wallet/confirm-withdraw-world', { amount });
      updateLocalUser(result.user);
      
      showToast('Retiro a World Chain exitoso.', 'success');
      if (input) input.value = '';
      
      btn.style = '';
      renderWalletContent();
      return; // Salimos temprano ya que el backend hizo todo
    } else {
      const amountWei = BigInt(amount * 1e6); // 6 decimals
      txHash = await withdrawUSDC(amountWei);
    }

    if (walletState.address) {
      const existing = walletState.history || [];
      existing.unshift({ type: 'Retiro', amount, hash: txHash, timestamp: Date.now(), blockNumber: 999999999 });
      walletState.history = existing;
      walletState.historyNeedsRecovery = false;
      localStorage.setItem(`tx_history_${walletState.address.toLowerCase()}`, JSON.stringify(existing));
    }

    // 2. Sync backend (restar depositado)
    const result = await api.post('/wallet/confirm-withdraw', { amount, isAdmin });
    updateLocalUser(result.user);
    
    showToast('Retiro exitoso desde el contrato.', 'success');
    if (input) input.value = '';
    
    btn.style = '';
    renderWalletContent();
  } catch (error) {
    console.error("Withdraw error:", error);
    showToast(error.shortMessage || error.message || 'Falló el retiro', 'error');
    
    btn.style = '';
    btn.textContent = 'Solicitar Retiro';
    btn.disabled = false;
  }
}

async function handleLinkActiveWallet() {
  if (!walletState.address) return;
  try {
    const result = await api.post('/wallet/connect', { walletAddress: walletState.address, chain: walletState.chain });
    updateLocalUser(result.user);
    showToast('¡Billetera vinculada exitosamente a tu perfil!', 'success');
    renderWalletContent();
  } catch (err) {
    console.error("Error linking wallet:", err);
    showToast(err.message || 'Error al vincular la billetera', 'error');
  }
}

async function handleDisconnect() {
  try {
    // If it was ethereum, disconnect from wagmi provider
    if (walletState.chain === 'ethereum') {
      await disconnectWallet();
    }
    walletState.address = null;
    showToast('Billetera desconectada', 'info');
    renderWalletContent();
  } catch (err) {
    console.error("Error disconnecting:", err);
  }
}

async function handleApprove() {
  const inputAmount = document.getElementById('stake-amount')?.value;
  if (!inputAmount || parseFloat(inputAmount) <= 0) {
    showToast('Por favor introduce una cantidad válida mayor a 0', 'warning');
    return;
  }

  try {
    const amountBigInt = parseEther(inputAmount);
    showToast('Solicitando aprobación del token en tu wallet EVM...', 'info');
    
    const txHash = await approveRewardToken(amountBigInt);
    showToast(`Aprobación exitosa. Hash: ${txHash.slice(0, 10)}...`, 'success');
    await loadWeb3Data(walletState.address);
  } catch (err) {
    console.error("Error in approval:", err);
    showToast(err.message || 'Error al aprobar tokens', 'error');
  }
}

async function handleDeposit() {
  const inputAmount = document.getElementById('stake-amount')?.value;
  if (!inputAmount || parseFloat(inputAmount) <= 0) {
    showToast('Por favor introduce una cantidad válida mayor a 0', 'warning');
    return;
  }

  try {
    const amountBigInt = parseEther(inputAmount);
    
    if (walletState.allowance < amountBigInt) {
      showToast('Por favor aprueba primero el gasto de tokens', 'warning');
      return;
    }

    showToast('Confirmando depósito en la blockchain...', 'info');
    const txHash = await depositTokens(amountBigInt);
    showToast(`¡Depósito completado exitosamente! Hash: ${txHash.slice(0, 10)}...`, 'success');
    
    if (document.getElementById('stake-amount')) {
      document.getElementById('stake-amount').value = '';
    }
    await loadWeb3Data(walletState.address);
  } catch (err) {
    console.error("Error depositing tokens:", err);
    showToast(err.message || 'Error al realizar el depósito', 'error');
  }
}


