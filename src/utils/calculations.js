/**
 * Betting calculations utility
 */

/**
 * Format currency as BRL
 */
export function formatBRL(value) {
  const num = Number(value) || 0;
  const abs = Math.abs(num).toFixed(2);
  const [intPart, decPart] = abs.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${num < 0 ? '-' : ''}R$ ${formatted},${decPart}`;
}

/**
 * Format date as Brazilian DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Format datetime as DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * Calculate ROI from apostas array
 * ROI = (total_profit / total_stake) * 100
 */
export function calcROI(apostas) {
  const finished = apostas.filter(a => a.resultado !== 'pending');
  if (finished.length === 0) return 0;
  const totalStake = finished.reduce((s, a) => s + (a.stake || 0), 0);
  const totalProfit = finished.reduce((s, a) => s + (a.lucro || 0), 0);
  if (totalStake === 0) return 0;
  return +((totalProfit / totalStake) * 100).toFixed(2);
}

/**
 * Calculate win rate
 * Win rate = wins / (wins + losses) * 100
 */
export function calcWinRate(apostas) {
  const finished = apostas.filter(a => a.resultado !== 'pending');
  if (finished.length === 0) return 0;
  const wins = finished.filter(a => a.resultado === 'win').length;
  return +((wins / finished.length) * 100).toFixed(1);
}

/**
 * Calculate total profit/loss
 */
export function calcProfitLoss(apostas, period = 'all') {
  let filtered = apostas.filter(a => a.resultado !== 'pending');

  if (period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(a => a.data === today);
  } else if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = filtered.filter(a => new Date(a.data) >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    filtered = filtered.filter(a => new Date(a.data) >= monthAgo);
  }

  return +filtered.reduce((s, a) => s + (a.lucro || 0), 0).toFixed(2);
}

/**
 * Find best and worst bets
 */
export function calcBestBet(apostas) {
  const finished = apostas.filter(a => a.resultado !== 'pending');
  if (finished.length === 0) return { best: null, worst: null };

  const best = finished.reduce((prev, cur) => (cur.lucro > prev.lucro ? cur : prev), finished[0]);
  const worst = finished.reduce((prev, cur) => (cur.lucro < prev.lucro ? cur : prev), finished[0]);

  return { best, worst };
}

/**
 * Calculate cumulative profit projection
 * @param {number} bankroll - starting bankroll
 * @param {number} dailyPct - daily % target
 * @param {number} days - projection days
 * @returns {number[]} daily bankroll values
 */
export function calcProjection(bankroll, dailyPct, days) {
  const result = [bankroll];
  let current = bankroll;
  for (let i = 0; i < days; i++) {
    current = current * (1 + dailyPct / 100);
    result.push(+current.toFixed(2));
  }
  return result;
}

/**
 * Calculate arbitrage profit percentage
 * @param {number[]} odds - array of decimal odds
 * @returns {{ possible: boolean, profit: number, stakes: number[] }}
 */
export function calcArbitrage(odds) {
  if (!odds || odds.length === 0) return { possible: false, profit: 0, stakes: [] };

  const sum = odds.reduce((s, o) => s + 1 / o, 0);
  const possible = sum < 1;
  const profit = possible ? +((1 / sum - 1) * 100).toFixed(2) : 0;

  const totalStake = 1000;
  const stakes = odds.map(o => +((totalStake / (o * sum))).toFixed(2));

  return { possible, profit, stakes };
}

/**
 * Build cumulative profit chart data from apostas (last N days)
 */
export function buildChartData(apostas, days = 7) {
  const labels = [];
  const data = [];
  let cumulative = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    const dayProfit = apostas
      .filter(a => a.data === dateStr && a.resultado !== 'pending')
      .reduce((s, a) => s + (a.lucro || 0), 0);

    cumulative += dayProfit;
    labels.push(dayLabel);
    data.push(+cumulative.toFixed(2));
  }

  return { labels, data };
}

/**
 * Get sport emoji
 */
export function getSportEmoji(esporte) {
  switch (esporte) {
    case 'futebol': return '⚽';
    case 'basquete': return '🏀';
    case 'tenis': return '🎾';
    case 'volei': return '🏐';
    case 'americano': return '🏈';
    default: return '🏆';
  }
}
