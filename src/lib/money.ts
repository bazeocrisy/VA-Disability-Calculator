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
