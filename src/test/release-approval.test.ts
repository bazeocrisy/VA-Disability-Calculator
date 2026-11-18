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

describe('repository state', () => {
  const root = resolve(__dirname, '../..');
  it('docs/audit.md is NOT currently approved for release (for any reviewer name)', () => {
    const audit = readFileSync(resolve(root, 'docs/audit.md'), 'utf8');
    for (const name of ['Any Reviewer', 'Marcus T. Hill', 'bazeocrisy']) {
      expect(checkReleaseApproval(audit, name).ok).toBe(false);
    }
    // and contains no approval-format line outside code blocks
    const outsideFences = audit.replace(/```[\s\S]*?```/g, '');
    expect(outsideFences).not.toMatch(/^\s*APPROVED FOR RELEASE — Reviewer:/m);
  });
  it('following the documented procedure on the real audit.md yields a valid approval (docs do not self-block)', () => {
    const audit = readFileSync(resolve(root, 'docs/audit.md'), 'utf8');
    const withoutStatus = audit
      .split('\n')
      .filter((l) => !/Release status: NOT APPROVED/.test(l))
      .join('\n');
    const approved = withoutStatus + '\nAPPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-12-01\n';
    expect(checkReleaseApproval(approved, 'Marcus T. Hill', '2026-12-15')).toEqual({
      ok: true,
      reviewer: 'Marcus T. Hill',
      date: '2026-12-01',
    });
    // ...but the same record indented as an example would not
    const indented = withoutStatus + '\n\n    APPROVED FOR RELEASE — Reviewer: Marcus T. Hill — Date: 2026-12-01\n';
    expect(checkReleaseApproval(indented, 'Marcus T. Hill', '2026-12-15').ok).toBe(false);
  });

  it('deploy.yml is manual, main-only, and runs the approval checker before building', () => {
    const wf = readFileSync(resolve(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(wf).toMatch(/^on:\n  workflow_dispatch:/m);
    expect(wf).not.toMatch(/^\s+(push|pull_request|schedule):/m);
    expect(wf).toContain('"$GITHUB_REF" != "refs/heads/main"');
    expect(wf).toContain("if: github.ref == 'refs/heads/main'");
    const gate = wf.indexOf('node scripts/release-approval.mjs docs/audit.md "$REVIEWER"');
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(wf.indexOf('npm run build'));
    expect(wf).toContain('REVIEWER: ${{ inputs.reviewer }}'); // passed via env, never interpolated into the script
  });
});
