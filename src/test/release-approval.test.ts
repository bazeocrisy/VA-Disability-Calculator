import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkReleaseApproval } from '../../scripts/release-approval.mjs';

const TODAY = '2026-12-15';
const REC = 'APPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-12-01';
const doc = (...lines: string[]) => ['# Audit log', '', ...lines, ''].join('\n');
const check = (md: string, reviewer = 'Marcus T. Hill') => checkReleaseApproval(md, reviewer, TODAY);
const reject = (md: string, reviewer?: string) => {
  const r = check(md, reviewer);
  expect(r.ok).toBe(false);
  return r.ok ? '' : r.reason;
};

describe('release approval gate', () => {
  it('accepts exactly one well-formed record matching the reviewer', () => {
    expect(check(doc('## Sign-off', REC))).toEqual({ ok: true, reviewer: 'Marcus T. Hill', date: '2026-12-01' });
  });
  it('normalizes surrounding whitespace in the supplied reviewer name', () => {
    expect(check(doc(REC), '  Marcus   T. Hill ').ok).toBe(true);
  });

  it('rejects a missing record', () => {
    expect(reject(doc('No approval yet.'))).toMatch(/No approval record/);
  });
  it('rejects a missing reviewer input', () => {
    expect(reject(doc(REC), '')).toMatch(/No reviewer/);
  });

  it('rejects negated approvals anywhere in the document', () => {
    expect(reject(doc(REC, '**Release status: NOT APPROVED.**'))).toMatch(/Negated/);
    expect(reject(doc('NOT APPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-12-01'))).toMatch(/Negated/);
    expect(reject(doc(REC, 'Approval revoked by Marcus T. Hill on 2026-12-02.'))).toMatch(/Negated/);
    expect(reject(doc(REC, 'Release approval withdrawn pending fixes.'))).toMatch(/Negated|Malformed/);
    expect(reject(doc(REC, 'Status: unapproved'))).toMatch(/Negated/);
  });

  it('rejects example-only and placeholder records', () => {
    expect(reject(doc('```', REC, '```'))).toMatch(/No approval record/); // fenced example ignored
    expect(reject(doc('<!-- ' + REC + ' -->'))).toMatch(/No approval record/); // commented example ignored
    expect(reject(doc('APPROVED FOR RELEASE — Reviewer: <your name> — Date: 2026-12-01'), '<your name>')).toMatch(
      /placeholder/,
    );
    expect(reject(doc('APPROVED FOR RELEASE — Reviewer: Example Reviewer — Date: 2026-12-01'), 'Example Reviewer')).toMatch(
      /placeholder/,
    );
    expect(reject(doc('APPROVED FOR RELEASE — Reviewer: Jane Doe — Date: 2026-12-01'), 'Jane Doe')).toMatch(/placeholder/);
  });

  it('rejects quoted, struck-through, prefixed or reworded approval lines', () => {
    expect(reject(doc('`' + REC + '`'))).toMatch(/Malformed/);
    expect(reject(doc('~~' + REC + '~~'))).toMatch(/Malformed/);
    expect(reject(doc('> ' + REC))).toMatch(/Malformed/);
    expect(reject(doc('- ' + REC))).toMatch(/Malformed/);
    expect(reject(doc('Approved for release by Marcus T. Hill'))).toMatch(/Malformed/);
    expect(reject(doc('APPROVED FOR RELEASE — Marcus T. Hill, 2026-12-01'))).toMatch(/Malformed/);
  });

  it('indented examples can never authorize a release (Markdown indented code blocks)', () => {
    const fourSpaces = doc('Example of the format:', '', '    ' + REC);
    const tab = doc('Example of the format:', '', '\t' + REC);
    for (const md of [fourSpaces, tab]) {
      const r = check(md);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/indented/);
    }
    // deeper / mixed indentation and list-nested or non-breaking-space prefixes
    for (const prefix of ['        ', '  \t', ' ', '  ', '   ', '\u00a0']) {
      expect(check(doc(prefix + REC)).ok, JSON.stringify(prefix)).toBe(false);
    }
    expect(check(doc('- item', '    ' + REC)).ok).toBe(false);
  });

  it('an indented example next to a genuine record still blocks (ambiguous document)', () => {
    expect(reject(doc(REC, '', '    ' + REC))).toMatch(/indented/);
    expect(reject(doc('\t' + REC, '', REC))).toMatch(/indented/);
  });

  it('validates the raw line: irregular internal or trailing whitespace is rejected', () => {
    expect(check(doc('APPROVED FOR RELEASE — Reviewer: Marcus  T. Hill — Date: 2026-12-01')).ok).toBe(false);
    expect(check(doc('APPROVED  FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-12-01')).ok).toBe(false);
    expect(check(doc(REC + ' ')).ok).toBe(false);
    expect(check(doc(REC + '\t')).ok).toBe(false);
  });

  it('a genuine standalone approval line still works, including with CRLF line endings', () => {
    expect(check(doc('## Sign-off', '', REC, '', 'Notes follow.'))).toEqual({
      ok: true,
      reviewer: 'Marcus T. Hill',
      date: '2026-12-01',
    });
    expect(check(['# Audit', '', REC, ''].join('\r\n')).ok).toBe(true);
  });

  it('rejects mismatched reviewers, including near-misses', () => {
    expect(reject(doc(REC), 'Someone Else')).toMatch(/names "Marcus T. Hill"/);
    expect(reject(doc(REC), 'marcus t. hill')).toMatch(/names/);
    expect(reject(doc(REC), 'Marcus Hill')).toMatch(/names/);
  });

  it('rejects more than one record', () => {
    expect(reject(doc(REC, 'APPROVED FOR RELEASE — Reviewer: Ana Ruiz — Date: 2026-12-02'))).toMatch(/exactly one/);
    expect(reject(doc(REC, REC))).toMatch(/exactly one/);
  });

  it('rejects invalid or future dates', () => {
    expect(reject(doc('APPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-02-30'))).toMatch(/date/);
    expect(reject(doc('APPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2027-01-01'))).toMatch(/date/);
  });
});

const ROOT = resolve(__dirname, '../..');
const fixture = (name: string) => readFileSync(resolve(__dirname, 'fixtures', name), 'utf8');
const NAME = 'Marcus T. Hill';
const RECORD_LINE = /^APPROVED FOR RELEASE — Reviewer: /;

describe('deployment checker on audit fixtures (independent of the live audit.md state)', () => {
  const unapproved = fixture('audit-awaiting-approval.md');
  const approved = fixture('audit-approved.md');

  it('unapproved audit is rejected for any reviewer', () => {
    for (const name of [NAME, 'Any Reviewer']) {
      const r = checkReleaseApproval(unapproved, name, TODAY);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/Negated/);
    }
    // even with the status line removed, the fenced example alone authorizes nothing
    const noStatus = unapproved.replace(/^\*\*Release status: NOT APPROVED\.\*\*.*$/m, '');
    expect(checkReleaseApproval(noStatus, NAME, TODAY)).toMatchObject({ ok: false, reason: expect.stringMatching(/No approval record/) });
  });

  it('valid approved audit is accepted for the recorded reviewer', () => {
    expect(checkReleaseApproval(approved, NAME, TODAY)).toEqual({ ok: true, reviewer: NAME, date: '2026-12-01' });
    expect(checkReleaseApproval(approved.replace(/\n/g, '\r\n'), NAME, TODAY).ok).toBe(true);
  });

  it('approved audit is rejected for a mismatched reviewer', () => {
    for (const name of ['Someone Else', 'marcus t. hill', 'Marcus Hill', '']) {
      expect(checkReleaseApproval(approved, name, TODAY).ok, name).toBe(false);
    }
  });

  it('approved audit with an invalid record is rejected', () => {
    const variants: [string, RegExp][] = [
      [approved.replace('Date: 2026-12-01', 'Date: 2026-02-30'), /date/],
      [approved.replace('Date: 2026-12-01', 'Date: 2027-01-01'), /date/],
      [approved.replace('Reviewer: Marcus T. Hill', 'Reviewer: <your full name>'), /placeholder/],
      [approved.replace('APPROVED FOR RELEASE — Reviewer: Marcus T. Hill', 'APPROVED FOR RELEASE: Marcus T. Hill'), /Malformed/],
      [approved + '\nAPPROVED FOR RELEASE — Reviewer: Ana Ruiz — Date: 2026-12-02\n', /exactly one/],
      [approved + '\nApproval revoked pending fixes.\n', /Negated/],
    ];
    for (const [md, reason] of variants) {
      const r = checkReleaseApproval(md, NAME, TODAY);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(reason);
    }
  });

  it('approved audit whose record is indented (4 spaces or tab) is rejected', () => {
    for (const indent of ['    ', '\t']) {
      const md = approved.replace(/^APPROVED FOR RELEASE — Reviewer: Marcus/m, `${indent}APPROVED FOR RELEASE — Reviewer: Marcus`);
      const r = checkReleaseApproval(md, NAME, TODAY);
      expect(r).toMatchObject({ ok: false, reason: expect.stringMatching(/indented/) });
    }
  });

  it('the instructions themselves never contain negated approval wording (only the status line does)', () => {
    for (const md of [readFileSync(resolve(ROOT, 'docs/audit.md'), 'utf8'), unapproved, approved]) {
      const negated = md.split('\n').filter((l) => /not\s+approved/i.test(l));
      expect(negated.every((l) => l.startsWith('**Release status: NOT APPROVED.**'))).toBe(true);
    }
  });

  it('fixtures follow the same approval instructions as the live audit.md', () => {
    const live = readFileSync(resolve(ROOT, 'docs/audit.md'), 'utf8');
    const example = 'APPROVED FOR RELEASE — Reviewer: <your full name> — Date: YYYY-MM-DD';
    for (const md of [live, unapproved, approved]) expect(md).toContain('```text\n' + example + '\n```');
  });
});

describe('live docs/audit.md (valid in BOTH legitimate states: awaiting approval, or validly approved)', () => {
  const live = readFileSync(resolve(ROOT, 'docs/audit.md'), 'utf8');
  const unfenced = live.replace(/```[\s\S]*?```/g, '');
  const records = unfenced.split(/\r?\n/).filter((l) => /approved for release/i.test(l));

  it('is either clearly awaiting approval or carries one record that the gate accepts', () => {
    if (records.length === 0) {
      // Awaiting approval: the explicit status line must be present and the gate must block.
      expect(live).toMatch(/Release status: NOT APPROVED/);
      expect(checkReleaseApproval(live, NAME).ok).toBe(false);
    } else {
      // Approved: exactly one record, and it passes the real gate for its own reviewer.
      expect(records).toHaveLength(1);
      expect(records[0]).toMatch(RECORD_LINE);
      const name = /Reviewer: (.+?) — Date:/.exec(records[0])![1];
      expect(checkReleaseApproval(live, name)).toMatchObject({ ok: true, reviewer: name });
    }
  });

  it('the documented procedure applied to the live audit.md yields a valid approval (prose never self-blocks)', () => {
    const withoutStatusOrRecord = live
      .split('\n')
      // exactly what the instructions say: delete ONLY the bold status line (and any prior record)
      .filter((l) => !l.startsWith('**Release status: NOT APPROVED.**') && !RECORD_LINE.test(l))
      .join('\n');
    const approved = withoutStatusOrRecord + `\nAPPROVED FOR RELEASE — Reviewer: ${NAME} — Date: 2026-12-01\n`;
    expect(checkReleaseApproval(approved, NAME, TODAY)).toEqual({ ok: true, reviewer: NAME, date: '2026-12-01' });
    const indented = withoutStatusOrRecord + `\n\n    APPROVED FOR RELEASE — Reviewer: ${NAME} — Date: 2026-12-01\n`;
    expect(checkReleaseApproval(indented, NAME, TODAY).ok).toBe(false);
  });
});

describe('deploy workflow', () => {
  it('deploy.yml is manual, main-only, and runs the approval checker before building', () => {
    const wf = readFileSync(resolve(ROOT, '.github/workflows/deploy.yml'), 'utf8');
    expect(wf).toMatch(/^on:\n  workflow_dispatch:/m);
    expect(wf).not.toMatch(/^\s+(push|pull_request|schedule):/m);
    expect(wf).toContain('"$GITHUB_REF" != "refs/heads/main"');
    expect(wf).toContain("if: github.ref == 'refs/heads/main'");
    const gate = wf.indexOf('node scripts/release-approval.mjs docs/audit.md "$REVIEWER"');
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(wf.indexOf('npm test'));
    expect(gate).toBeLessThan(wf.indexOf('npm run build'));
    expect(wf).toContain('REVIEWER: ${{ inputs.reviewer }}'); // passed via env, never interpolated into the script
  });
});
