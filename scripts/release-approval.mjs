#!/usr/bin/env node
/**
 * Release-approval gate for .github/workflows/deploy.yml.
 *
 * docs/audit.md must contain EXACTLY ONE approval record, on its own unindented line, outside code
 * blocks. The raw line must match exactly (only a CRLF line ending is tolerated):
 *
 *   APPROVED FOR RELEASE — Reviewer: Jane Q. Doe — Date: 2026-12-01
 *
 * Rejected: missing record; more than one record; any other line mentioning
 * "APPROVED FOR RELEASE" (indented — e.g. a 4-space or tab-indented Markdown code block —, quoted,
 * struck through, prefixed, reworded, irregular spacing); any negation such as
 * "NOT APPROVED" or a revoked/withdrawn/rescinded approval; placeholder or example names;
 * invalid or future dates; a reviewer name that does not exactly match the one supplied to the
 * workflow. Example records inside fenced code blocks and HTML comments are ignored.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RECORD = /^APPROVED FOR RELEASE — Reviewer: (.+?) — Date: (\d{4}-\d{2}-\d{2})$/;
const PLACEHOLDER = /[<>[\]{}]|\b(example|sample|placeholder|your name|reviewer name|name here|tbd|todo|n\/a|xxx|jane doe|john doe)\b/i;
const NEGATION = [
  /\bnot\s+approved\b/i,
  /\bunapproved\b/i,
  /\bapproval\s+(?:is\s+|was\s+|has\s+been\s+)?(?:revoked|withdrawn|rescinded|denied|pending)\b/i,
  /\b(?:revoked|withdrawn|rescinded|denied)\s+(?:the\s+)?(?:release\s+)?approval\b/i,
];

const normalize = (s) => s.replace(/\s+/g, ' ').trim();

function stripNonContent(markdown) {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const out = [];
  let fence = null;
  for (const line of lines) {
    const m = /^\s*(```+|~~~+)/.exec(line);
    if (m) {
      if (!fence) fence = m[1][0];
      else if (m[1][0] === fence) fence = null;
      continue;
    }
    if (!fence) out.push(line);
  }
  return out;
}

function isValidPastDate(iso, today) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  return iso <= today;
}

/**
 * @param {string} markdown contents of docs/audit.md
 * @param {string} reviewer reviewer name supplied to the workflow
 * @param {string} [today] YYYY-MM-DD (defaults to the current UTC date)
 * @returns {{ ok: true, reviewer: string, date: string } | { ok: false, reason: string }}
 */
export function checkReleaseApproval(markdown, reviewer, today = new Date().toISOString().slice(0, 10)) {
  const wanted = normalize(reviewer ?? '');
  if (!wanted) return { ok: false, reason: 'No reviewer name was supplied.' };
  if (PLACEHOLDER.test(wanted)) return { ok: false, reason: 'The supplied reviewer name looks like a placeholder.' };

  const lines = stripNonContent(markdown);
  for (const line of lines) {
    if (NEGATION.some((re) => re.test(line))) {
      return { ok: false, reason: `Negated or withdrawn approval text found: "${line.trim()}"` };
    }
  }

  const records = [];
  for (const raw of lines) {
    if (!/approved for release/i.test(raw)) continue;
    // Validate the RAW line — never normalize first. Markdown renders a line indented by
    // 4+ spaces or a tab as code, and any indentation can nest it in a list or quote, so an
    // indented record is only an example and must never authorize a release.
    if (/^[ \t\u00a0]/.test(raw)) {
      return {
        ok: false,
        reason: `Approval line is indented (Markdown may render it as a code block or nested text): "${raw.trim()}"`,
      };
    }
    const m = RECORD.exec(raw);
    if (!m) return { ok: false, reason: `Malformed approval line (must match the exact format): "${raw.trim()}"` };
    if (m[1] !== normalize(m[1])) {
      return { ok: false, reason: `Approval line has irregular spacing in the reviewer name: "${raw}"` };
    }
    records.push({ name: m[1], date: m[2] });
  }

  if (records.length === 0) return { ok: false, reason: 'No approval record found in docs/audit.md.' };
  if (records.length > 1) return { ok: false, reason: `Expected exactly one approval record, found ${records.length}.` };

  const [rec] = records;
  if (PLACEHOLDER.test(rec.name)) return { ok: false, reason: `Approval record uses a placeholder/example name: "${rec.name}"` };
  if (!isValidPastDate(rec.date, today)) return { ok: false, reason: `Approval date is invalid or in the future: ${rec.date}` };
  if (rec.name !== wanted) {
    return { ok: false, reason: `Approval record names "${rec.name}", but the workflow was run for "${wanted}".` };
  }
  return { ok: true, reviewer: rec.name, date: rec.date };
}

// CLI: node scripts/release-approval.mjs <path-to-audit.md> <reviewer>
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [file, reviewer] = process.argv.slice(2);
  const result = checkReleaseApproval(readFileSync(file, 'utf8'), reviewer);
  if (result.ok) {
    console.log(`Release approval verified: ${result.reviewer} on ${result.date}.`);
  } else {
    console.error(`::error::Release blocked — ${result.reason}`);
    process.exit(1);
  }
}
