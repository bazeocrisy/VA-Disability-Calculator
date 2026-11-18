import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Independent parser for the saved VA.gov page. It reads the raw <va-table> markup so the
 * tests verify src/data/rates2026.ts against the official page, not against itself.
 */
export interface SnapshotTable {
  title: string;
  rows: string[][];
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export function loadVaSnapshot(): { tables: SnapshotTable[]; text: string } {
  const html = readFileSync(
    resolve(__dirname, '../../docs/evidence/va-veteran-rates-2026-retrieved-2026-11-18.html'),
    'utf8',
  );
  const tables: SnapshotTable[] = [];
  const tableRe = /<va-table table-title="([^"]*)"[^>]*>([\s\S]*?)<\/va-table>/g;
  for (const m of html.matchAll(tableRe)) {
    const rows: string[][] = [];
    for (const r of m[2].matchAll(/<va-table-row[^>]*>([\s\S]*?)<\/va-table-row>/g)) {
      rows.push([...r[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((c) => decode(c[1])));
    }
    tables.push({ title: decode(m[1]), rows });
  }
  return { tables, text: decode(html) };
}

/** "1,132.90" → 113290 cents, via string manipulation only (no floats). */
export function dollarsToCents(s: string): number {
  const m = /^(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`Unexpected money format: "${s}"`);
  return Number(m[1].replace(/,/g, '')) * 100 + Number(m[2]);
}

export function loadTableI(): Map<string, number> {
  const html = readFileSync(resolve(__dirname, '../../docs/evidence/ecfr-38cfr4.25-retrieved-2026-11-18.html'), 'utf8');
  const table = /<table[\s\S]*?<\/table>/.exec(html)![0];
  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) =>
    [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => decode(c[1])),
  );
  const cols = rows[0].slice(1).map(Number);
  const map = new Map<string, number>();
  for (const row of rows.slice(1)) {
    const a = Number(row[0]);
    row.slice(1).forEach((v, i) => map.set(`${a}|${cols[i]}`, Number(v)));
  }
  return map;
}
