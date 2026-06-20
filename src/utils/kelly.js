/**
 * Kelly Criterion Calculator
 * f* = (bp - q) / b
 * b = odd - 1 (net decimal odds)
 * p = probability of winning
 * q = 1 - p (probability of losing)
 */

const RISK_MULTIPLIERS = {
  conservador: 0.25,
  moderado: 0.5,
  agressivo: 1.0,
};

/**
 * Calculate raw Kelly fraction
 * @param {number} odd - decimal odd (e.g. 2.10)
 * @param {number} confidence - win probability as percentage (0-100)
 * @returns {number} Kelly fraction (0-1)
 */
export function calculateKelly(odd, confidence) {
  const p = confidence / 100;
  const q = 1 - p;
  const b = odd - 1;

  if (b <= 0 || p <= 0) return 0;

  const kelly = (b * p - q) / b;
  return Math.max(0, Math.min(kelly, 1));
}

/**
 * Calculate recommended bet size
 * @param {number} bankroll - current bankroll
 * @param {number} odd - decimal odd
 * @param {number} confidence - win probability as % (0-100)
 * @param {string} riskLevel - 'conservador' | 'moderado' | 'agressivo'
 * @returns {{ fraction: number, amount: number, kellyRaw: number }}
 */
export function calculateBetSize(bankroll, odd, confidence, riskLevel = 'moderado') {
  const kellyRaw = calculateKelly(odd, confidence);
  const multiplier = RISK_MULTIPLIERS[riskLevel] || 0.5;
  const fraction = kellyRaw * multiplier;
  const amount = bankroll * fraction;

  return {
    fraction: +fraction.toFixed(4),
    amount: +amount.toFixed(2),
    kellyRaw: +kellyRaw.toFixed(4),
  };
}

/**
 * Calculate expected value
 * @param {number} odd - decimal odd
 * @param {number} confidence - as % (0-100)
 * @param {number} stake - bet amount
 * @returns {number} expected value in currency
 */
export function calculateEV(odd, confidence, stake) {
  const p = confidence / 100;
  const q = 1 - p;
  return +(stake * p * (odd - 1) - stake * q).toFixed(2);
}
