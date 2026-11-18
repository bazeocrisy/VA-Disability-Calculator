import type { CompensationResult, Household } from './compensation';
import { formatCents, formatSignedCents } from './money';

function describe(label: string, r: CompensationResult): string[] {
  if (r.kind === 'ok') {
    return [
      `${label}: ${formatCents(r.monthly)}/month · ${formatCents(r.annual)}/year`,
      ...r.lines.map((l) => `  - ${l.label}: ${formatCents(l.cents)}`),
    ];
  }
  if (r.kind === 'unsupported') return [`${label}: no estimate — ${r.reasons.join(' ')}`];
  return [`${label}: invalid input — ${r.errors.join(' ')}`];
}

/** Plain-text summary for copy/print. Contains no personal identifiers. */
export function buildSummary(h: Household, r2026: CompensationResult, r2027: CompensationResult): string {
  const lines = [
    'VeteranPay — VA compensation estimate',
    `Rating: ${h.rating}% · Spouse: ${h.hasSpouse ? 'yes' : 'no'}${h.spouseAidAndAttendance ? ' (Aid and Attendance)' : ''} · Children under 18: ${h.childrenUnder18} · Children 18–23 in school: ${h.schoolChildren} · Dependent parents: ${h.dependentParents}${h.permanentlyIncapableAdultChild ? ' · Adult child recognized by VA as permanently incapable of self-support: yes' : ''}`,
    '',
    ...describe('2026 OFFICIAL (effective Dec 1, 2025)', r2026),
    ...describe('2027 PROJECTED (not an official VA rate)', r2027),
  ];
  if (r2026.kind === 'ok' && r2027.kind === 'ok') {
    const d = r2027.monthly - r2026.monthly;
    lines.push('', `Projected COLA difference: ${formatSignedCents(d)}/month · ${formatSignedCents(d * 12)}/year`);
  }
  lines.push(
    '',
    'Source: https://www.va.gov/disability/compensation-rates/veteran-rates/ (verified 2026-11-18).',
    'Independent veteran resource. Not affiliated with the U.S. Department of Veterans Affairs.',
  );
  return lines.join('\n');
}
