# Claude Code — VA Disability Calculator

Implement a public, accessible, privacy-preserving VA compensation calculator in this repository: **bazeocrisy/VA-Disability-Calculator**.

## Mandatory correctness
1. Retrieve all official 2026 VA compensation tables directly from https://www.va.gov/disability/compensation-rates/veteran-rates/ . Record URLs, effective dates, retrieval date, and cell coverage in docs/rate-sources.md. Never invent missing rates.
2. Verify the 2027 COLA using official SSA and VA sources. Until final VA 2027 tables are published, mark all 2027 numbers **PROJECTED** and show last-verified date. Projected amounts are not official VA rates.
3. Implement 38 CFR 4.25 combined-ratings TABLE logic, including intermediate rounding and final nearest-10 rounding; implement 38 CFR 4.26 bilateral factor and the exception where its use is less favorable. Do not merely sum disability percentages.
4. Use official household rate rows at ratings 30–100, with spouse, first child, additional under-18 children, qualifying schoolchildren, 0–2 dependent parents, spouse Aid & Attendance. Do not assume spouse/first-child additions are flat or independent of household. At 10/20%, dependents do not increase payment.
5. Never infer TDIU or SMC eligibility. Unsupported cases must show an explicit warning rather than a made-up number.
6. Store money as integer cents; document decimal and rounding rules. Separate versioned rate data from business logic.
7. No names, SSNs, claim IDs, birth dates, medical uploads, analytics, accounts, or server persistence.

## Build
React + TypeScript + Vite + Vitest; accessible, responsive mobile-first design. Tabs: Quick Pay, Combined Rating, How It Works, Sources. Quick Pay compares official 2026 and projected 2027 monthly/annual compensation and COLA differences with an itemized breakdown. Combined Rating supports condition percentages, bilateral side/type and transparent calculation steps.

GitHub Pages Vite base must be `/VA-Disability-Calculator/`, not Calculator.

## Workflow and release gate
Start with implementation plan and complete rate coverage matrix. Create a feature branch and PR. Automated CI must run tests/build. Test every populated official rate-table cell and dependent permutation, 10/20% dependent invariance, 50+30+20 => 70, ordering invariance, bilateral edge cases, unsupported cases, rounding boundaries, and projection labels. Record evidence in docs/audit.md. **Do not publish a calculator with unverified rates.** Deploy with GitHub Actions only after verification and review. Clearly state independent, not affiliated with VA.
