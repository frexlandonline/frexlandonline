// Sistema de Niveles de Jugadores por Depósito en USDC y Beneficios de Referidos
export const LEVELS = [
  {
    id: 'diamante',
    name: 'Diamante',
    icon: '💎',
    badgeText: 'Diamante',
    min: 1000,
    max: Infinity,
    color: '#00f5ff',
    borderColor: 'rgba(0, 245, 255, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 245, 255, 0.25) 0%, rgba(188, 19, 254, 0.35) 100%)',
    shadow: '0 0 16px rgba(0, 245, 255, 0.5)',
    perk: '100+ créditos/sem • 100% Premio • Referidos: 5% N1 + 3% N2 • Transferir créditos',
    canRefer: true,
    canTransferCredits: true,
    referralL1: 0.05,
    referralL2: 0.03
  },
  {
    id: 'platino',
    name: 'Platino',
    icon: '💠',
    badgeText: 'Platino',
    min: 500,
    max: 1000,
    color: '#e0e7ff',
    borderColor: 'rgba(165, 180, 252, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(165, 180, 252, 0.22) 0%, rgba(99, 102, 241, 0.3) 100%)',
    shadow: '0 0 14px rgba(165, 180, 252, 0.4)',
    perk: '50 a 99 créditos/sem • 100% Premio • Referidos: 5% N1 + 1% N2 • Transferir créditos',
    canRefer: true,
    canTransferCredits: true,
    referralL1: 0.05,
    referralL2: 0.01
  },
  {
    id: 'oro',
    name: 'Oro',
    icon: '🥇',
    badgeText: 'Oro',
    min: 100,
    max: 500,
    color: '#ffd700',
    borderColor: 'rgba(255, 215, 0, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.22) 0%, rgba(217, 119, 6, 0.3) 100%)',
    shadow: '0 0 14px rgba(255, 215, 0, 0.4)',
    perk: '10 a 49 créditos/sem • 100% Premio • Referidos: 3% N1 • Transferir créditos',
    canRefer: true,
    canTransferCredits: true,
    referralL1: 0.03,
    referralL2: 0
  },
  {
    id: 'plata',
    name: 'Plata',
    icon: '🥈',
    badgeText: 'Plata',
    min: 50,
    max: 100,
    color: '#e2e8f0',
    borderColor: 'rgba(203, 213, 225, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(226, 232, 240, 0.18) 0%, rgba(148, 163, 184, 0.28) 100%)',
    shadow: '0 0 12px rgba(203, 213, 225, 0.35)',
    perk: '5 a 9 créditos/sem • 100% Premio • Referidos: 1% N1',
    canRefer: true,
    canTransferCredits: false,
    referralL1: 0.01,
    referralL2: 0
  },
  {
    id: 'bronce',
    name: 'Bronce',
    icon: '🥉',
    badgeText: 'Bronce',
    min: 10,
    max: 50,
    color: '#cd7f32',
    borderColor: 'rgba(205, 127, 50, 0.55)',
    bgGradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(180, 83, 9, 0.28) 100%)',
    shadow: '0 0 12px rgba(205, 127, 50, 0.35)',
    perk: '1 a 4 créditos/sem • 100% Premio • Habilita Código de Referido',
    canRefer: true,
    canTransferCredits: false,
    referralL1: 0,
    referralL2: 0
  },
  {
    id: 'madera',
    name: 'Madera',
    icon: '🌳',
    badgeText: 'Madera',
    min: 1,
    max: 10,
    color: '#d97706',
    borderColor: 'rgba(217, 119, 6, 0.55)',
    bgGradient: 'linear-gradient(135deg, rgba(180, 83, 9, 0.22) 0%, rgba(120, 53, 15, 0.32) 100%)',
    shadow: '0 0 12px rgba(217, 119, 6, 0.35)',
    perk: '1 crédito semanal • Premio proporcional (10% por cada 1 USDC)',
    canRefer: false,
    canTransferCredits: false,
    referralL1: 0,
    referralL2: 0
  },
  {
    id: 'none',
    name: 'Sin Rango',
    icon: '🌱',
    badgeText: 'Sin Rango',
    min: 0,
    max: 1,
    color: '#94a3b8',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    bgGradient: 'rgba(255, 255, 255, 0.05)',
    shadow: 'none',
    perk: 'Participa en Tabla Global Informativa • Deposita ≥ 1 USDC para Rango Madera',
    canRefer: false,
    canTransferCredits: false,
    referralL1: 0,
    referralL2: 0
  }
];

/**
 * Calcula los créditos semanales correspondientes al depósito acumulado:
 * - < 1 USDC (Sin Rango): 0 créditos
 * - >= 1 y < 10 USDC (Madera): 1 crédito semanal
 * - >= 10 USDC (Bronce+): 1 crédito por cada 10 USDC (sin crédito adicional por Madera)
 */
export function calculateDepositCredits(depositAmount = 0) {
  const deposit = Number(depositAmount) || 0;
  if (deposit < 1) return 0;
  if (deposit < 10) return 1;
  return Math.floor((deposit + 0.000001) / 10);
}

export function getUserLevel(depositAmount = 0) {
  const deposit = Number(depositAmount) || 0;
  if (deposit >= 1000) {
    return {
      ...LEVELS[0],
      deposit,
      nextLevel: null,
      toNext: 0,
      progress: 100,
      isMax: true
    };
  }
  if (deposit >= 500) {
    const toNext = Number((1000 - deposit).toFixed(2));
    const progress = Math.min(100, Math.round(((deposit - 500) / 500) * 100));
    return {
      ...LEVELS[1],
      deposit,
      nextLevel: LEVELS[0],
      toNext,
      progress,
      isMax: false
    };
  }
  if (deposit >= 100) {
    const toNext = Number((500 - deposit).toFixed(2));
    const progress = Math.min(100, Math.round(((deposit - 100) / 400) * 100));
    return {
      ...LEVELS[2],
      deposit,
      nextLevel: LEVELS[1],
      toNext,
      progress,
      isMax: false
    };
  }
  if (deposit >= 50) {
    const toNext = Number((100 - deposit).toFixed(2));
    const progress = Math.min(100, Math.round(((deposit - 50) / 50) * 100));
    return {
      ...LEVELS[3],
      deposit,
      nextLevel: LEVELS[2],
      toNext,
      progress,
      isMax: false
    };
  }
  if (deposit >= 10) {
    const toNext = Number((50 - deposit).toFixed(2));
    const progress = Math.min(100, Math.round(((deposit - 10) / 40) * 100));
    return {
      ...LEVELS[4],
      deposit,
      nextLevel: LEVELS[3],
      toNext,
      progress,
      isMax: false
    };
  }
  if (deposit >= 1) {
    const toNext = Number((10 - deposit).toFixed(2));
    const progress = Math.min(100, Math.round(((deposit - 1) / 9) * 100));
    return {
      ...LEVELS[5],
      deposit,
      nextLevel: LEVELS[4],
      toNext,
      progress,
      isMax: false
    };
  }
  const toNext = Number((1 - deposit).toFixed(2));
  const progress = Math.min(100, Math.max(0, Math.round((deposit / 1) * 100)));
  return {
    ...LEVELS[6],
    deposit,
    nextLevel: LEVELS[5],
    toNext,
    progress,
    isMax: false
  };
}

export function renderLevelBadge(levelObj, size = 'sm') {
  if (!levelObj || levelObj.id === 'none') {
    return `<span class="level-badge level-none ${size}" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 2px 8px; font-size: ${size === 'sm' ? '0.72rem' : '0.85rem'}; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">🌱 Sin Rango</span>`;
  }
  return `
    <span class="level-badge level-${levelObj.id} ${size}" style="background: ${levelObj.bgGradient}; color: ${levelObj.color}; border: 1px solid ${levelObj.borderColor}; box-shadow: ${levelObj.shadow}; border-radius: 20px; padding: 2px 9px; font-size: ${size === 'sm' ? '0.72rem' : '0.85rem'}; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; letter-spacing: 0.02em; vertical-align: middle;">
      <span>${levelObj.icon}</span>
      <span>${levelObj.name}</span>
    </span>
  `;
}
