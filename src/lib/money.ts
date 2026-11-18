import type { Cents } from '../data/types';

/**
 * Money rules
 * - All amounts are integer cents. Addition and multiplication by integers are exact.
 * - Annual amount = monthly cents × 12 (exact; no rounding).
 * - The only rounding anywhere is in the 2027 PROJECTION: each official 2026 cell is
 *   multiplied by (1 + COLA) using integer basis points and rounded half-up to the cent.
 */
export function assertCents(value: number): Cents {
  if (!Number.isSafeInteger(value)) throw new Error(`Not an integer cent amount: ${value}`);
  return value;
}

/** cents × (10000 + bp) / 10000, rounded half-up to a whole cent. Integer math only. */
export function applyBasisPoints(cents: Cents, basisPoints: number): Cents {
  assertCents(cents);
  if (!Number.isInteger(basisPoints)) throw new Error('basisPoints must be an integer');
  const scaled = cents * (10000 + basisPoints); // exact: < 2^53 for any realistic amount
  return Math.floor((scaled + 5000) / 10000);
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  // Format from an exact string to avoid any float artefacts.
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const formatted = usd.format(Number(`${dollars}.${String(rem).padStart(2, '0')}`));
  return sign + formatted;
}

export function formatSignedCents(cents: Cents): string {
  return (cents > 0 ? '+' : '') + formatCents(cents);
}

/** 360 basis points → "1.036"; 25 → "1.0025". Exact decimal string, no floating point. */
export function formatMultiplier(basisPoints: number): string {
  if (!Number.isInteger(basisPoints) || basisPoints < 0) throw new Error('basisPoints must be a non-negative integer');
  const whole = 1 + Math.floor(basisPoints / 10000);
  const frac = String(basisPoints % 10000).padStart(4, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** 360 basis points → "3.6%". */
export function formatPercentFromBasisPoints(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const frac = String(basisPoints % 100).padStart(2, '0').replace(/0+$/, '');
  return `${whole}${frac ? '.' + frac : ''}%`;
}
