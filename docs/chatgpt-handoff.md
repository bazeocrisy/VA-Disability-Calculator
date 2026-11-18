# VeteranPay — Handoff Brief for ChatGPT

> **Purpose:** Give this whole file to ChatGPT to brainstorm with and to produce the hero artwork.
> It has the project context, current status, the image prompt, upload steps, the review checklist, and **every open item**.
> Last updated: November 18, 2026 (after second independent review of commit 53109e8).

---

## 1. Project at a glance

| Item | Detail |
|---|---|
| Name | **VeteranPay** — VA Disability Compensation Calculator |
| Repository | https://github.com/bazeocrisy/VA-Disability-Calculator |
| Working branch | `claude/veteranpay-calculator` |
| Pull request | https://github.com/bazeocrisy/VA-Disability-Calculator/pull/1 |
| Future site URL | https://bazeocrisy.github.io/VA-Disability-Calculator/ (**not deployed yet**) |
| Tech | React + TypeScript + Vite + Vitest. Static site on GitHub Pages. |
| Mission | A professional, patriotic, accurate, privacy-first calculator that honors U.S. veterans. |
| Disclaimer (always shown) | "Independent veteran resource. Not affiliated with the U.S. Department of Veterans Affairs." |

### Brand
- **Feel:** military heritage meets modern technology; premium, respectful, not a government form, not childish.
- **Colors:** Navy `#071B33` · Military blue `#12365A` · American red `#B22234` · White `#FFFFFF` · Gold `#D4AF37` · subtle charcoal backgrounds.
- **Fonts:** Oswald for headlines, Source Sans 3 for body text.
- **Hero copy:** "YOU SERVED. YOU EARNED IT." / "Know Your Rating. Understand Your Benefits. Calculate Your Compensation." / Buttons: "Calculate My VA Compensation" and "Calculate My Combined Rating".

---

## 2. What is already built (done and tested)

- **Hero section**: headline, both buttons, disclaimer, and a waving American flag drawn to official proportions (50 stars, 13 stripes). All six branches are shown with founding years: Army 1775, Navy 1775, Marine Corps 1775, Air Force 1947, Coast Guard 1790, Space Force 2019.
- **Quick Pay (compensation calculator)**:
  - Inputs: rating 10–100%, spouse, spouse Aid & Attendance, children under 18, children 18–23 in school, 0–2 dependent parents.
  - Shows **2026 official** and **2027 projected** amounts, monthly and annual.
  - Shows the COLA difference, an itemized breakdown, and copy, print and reset buttons.
- **Combined Rating calculator**: uses VA's official combining table (38 CFR § 4.25), applies the bilateral factor for both arms or both legs (§ 4.26, including the "most favorable" exception), and shows every step.
- **How It Works** and **Sources** pages in plain language, linking to VA.gov, federal regulations and SSA.
- **Privacy**: no accounts, no tracking, no cookies, no server. Nothing the user enters leaves their device.

### Accuracy evidence
- All **122** official 2026 VA rate amounts were read directly from VA.gov and checked automatically against a saved copy of the page.
- **61 / 61** automated tests pass. They cover:
  - every rate cell
  - 1,872 family combinations
  - 10%/20% amounts not changing with dependents
  - 50% + 30% + 20% = 70%
  - rounding rules
  - bilateral cases
- An independent reviewer found 1 bug: very large bilateral groups. It is **fixed**.
- Accessibility scan (WCAG 2.2 AA): **0 violations** on desktop and mobile. Keyboard and reduced-motion are supported.

### Verified numbers (for reference — do not change them)
- 2026 rates are effective **December 1, 2025** (VA.gov page last updated November 2, 2026).
- Examples: 10% = **$180.42**, 20% = **$356.66**, 30% alone = **$552.47**, 70% alone = **$1,808.45**, 100% alone = **$3,938.58**.
- Social Security announced a **3.6% COLA for 2027** on **October 14, 2026** (confirmed directly on SSA's announcement). VA says it is required by law to match it. 2027 projections = 2026 rates × 1.036.
- **VA has not yet published official 2027 tables**, so every 2027 number on the site is labeled **PROJECTED**.

---

## 3. Ground rules for brainstorming (please respect these)

1. **Never invent or "estimate" VA rates.** Every dollar amount must come from VA.gov. If you suggest a feature that needs new numbers (for example SMC rates or survivor DIC), say which official VA page the numbers must come from.
2. **2027 stays labeled "PROJECTED"** until VA publishes its official 2027 table.
3. **Never assume TDIU or SMC eligibility.** Only VA grants these.
4. **No personal data**: no names, Social Security numbers, claim numbers, birth dates, medical uploads, accounts, analytics or tracking.
5. **No real people, no official seals or logos** in any artwork.
6. Keep the design **readable first**: no text placed over busy imagery, strong contrast, works on phones.

---

## 4. HERO IMAGE — prompt to use

Copy everything in the box below into ChatGPT's image generator.

```
Create a photorealistic, cinematic hero image for a website that honors U.S. military veterans.

SUBJECT
Six Black American service members standing together as one unified military family. Three men and three women, of different ages (mid-20s to mid-50s), skin tones, heights, builds and hairstyles that meet regulations. Every face must be a fictional person, not anyone real or recognizable. Expressions are proud, calm and dignified, with no exaggerated or stereotyped features.

Each person is from a different branch, in that branch's current dress uniform:
1. U.S. Army – Army Green Service Uniform: olive-drab coat, tan trousers or skirt, service cap or garrison cap.
2. U.S. Navy – Service Dress Blues: dark navy double-breasted jacket, white combination cover.
3. U.S. Marine Corps – Blue Dress: dark blue high-collar coat, white frame cover, blue trousers with a red stripe.
4. U.S. Air Force – Service Dress: dark blue coat, light blue shirt, service cap or flight cap.
5. U.S. Coast Guard – Service Dress Blue: Coast Guard blue (slightly lighter and grayer than the Navy's), white combination cover. It must look clearly different from the Navy uniform.
6. U.S. Space Force – Space Force service dress: dark navy-gray coat with silver-toned buttons.

ACCURACY RULES (important)
- Keep insignia, rank devices, badges, ribbons and name tags minimal, small, or softly out of focus. Do not invent incorrect insignia, and do not put any branch's insignia on another branch's uniform.
- No official seals, emblems, logos, text, letters or numbers anywhere in the image.
- No weapons.

COMPOSITION
- Group shot from the waist or knees up, standing in a slight arc, shoulder to shoulder, facing the camera.
- Behind them, a large American flag fills the background, gently waving: 13 red and white stripes, a blue canton with white stars, correct colors, never upside down or mirrored.
- Dramatic but tasteful lighting: warm golden key light from the upper left and a cool rim light. Subtle haze. Deep navy shadows.
- Keep all six faces inside the central 60% of the frame width, with clear space above the heads, so the image can be cropped for phone screens without cutting off faces.
- Color mood: navy blue, American red, white and subtle gold accents. Premium, cinematic, respectful. Not cartoonish, not a recruitment poster with text.

OUTPUT
- Landscape 16:9, at least 2400 × 1350 pixels, JPG.
- Also write one sentence of alt text describing the image.
```

### If a revision is needed, useful follow-up prompts
- "Make the Coast Guard uniform clearly lighter and grayer blue than the Navy uniform, keep everything else the same."
- "Remove all visible insignia, ribbons and name tags; keep uniforms otherwise unchanged."
- "The flag is mirrored — the blue star field must be in the upper-left corner as the viewer sees it when the flag is not reversed. Fix only the flag."
- "Move the group closer together so all six faces sit in the middle 60% of the image."
- "Make the faces more varied in age; one man and one woman should look in their 50s."

### Optional extra image (nice to have)
**Social share image** (shown when the link is posted on Facebook, X, iMessage, etc.):
```
Using the same six service members and flag from the hero image, create a 1200 × 630 pixel JPG
with the group on the right two-thirds and a clean, dark navy area on the left third (no text —
the website will add text). Same lighting, same uniforms, no insignia, no logos, no text.
```
Save as `public/og-image.jpg`.

---

## 5. How to deliver the image to the repository

1. Open the upload folder: https://github.com/bazeocrisy/VA-Disability-Calculator/tree/claude/veteranpay-calculator/public/hero
2. Rename your image file to exactly **`service-members.jpg`**.
3. Click **Add file → Upload files** and drag the image in.
4. Choose **"Commit directly to the `claude/veteranpay-calculator` branch"** (not `main`) and click **Commit changes**.
5. Tell Claude: "Hero image uploaded" and paste the alt text.

Claude will then:
- inspect it at full size against the checklist below;
- compress it for fast loading;
- switch the site from the placeholder to the real image;
- retake desktop and mobile screenshots;
- update `docs/audit.md`, `docs/hero-artwork.md`, and the pull request.

---

## 6. Hero image review checklist (Claude will check every line)

- [ ] Exactly six people; three men and three women.
- [ ] All are Black Americans of varied ages and appearances; dignified, no stereotypes.
- [ ] One person per branch: Army, Navy, Marine Corps, Air Force, Coast Guard, Space Force.
- [ ] Each uniform is recognizable and correct for its branch; Navy and Coast Guard look different.
- [ ] No wrong, invented or mixed-up insignia; no seals, logos, text or numbers.
- [ ] No real or recognizable person.
- [ ] Flag correct: 13 stripes, blue canton with stars, not mirrored or upside down.
- [ ] Faces stay visible when cropped for a phone screen.
- [ ] No AI defects (extra fingers, melted faces, warped buttons, garbled details).
- [ ] At least 2400 px wide; looks sharp.

---

## 7. ALL OPEN ITEMS

### Must be done before the site goes public (release blockers)

| # | Item | Owner | How to close |
|---|---|---|---|
| 1 | ~~**Hero artwork**~~ — **DONE 2026-11-18.** ChatGPT image installed and reviewed; see `docs/hero-artwork.md` | — | Closed |
| 2 | ~~**Confirm the 3.6% COLA**~~ — **DONE 2026-11-18.** SSA's official announcement was checked directly and confirms 3.6% | — | Closed |
| 3 | **Human accuracy review** | You or a trusted reviewer (ideally a VSO or someone familiar with VA rates) | Spot-check several amounts in the calculator against https://www.va.gov/disability/compensation-rates/veteran-rates/ — e.g. 70% with spouse and 1 child = $2,074.45; 30% with spouse = $617.47. |
| 4 | **Check the links Claude couldn't open** | You | Click the SSA and Congress.gov links on the site's **Sources** tab and confirm they load (both blocked automated checks; VA.gov and eCFR links were confirmed working). |
| 5 | **Record approval** | You | In `docs/audit.md`, delete the bold release-status line and add one **unindented** line (no leading spaces or tabs) in exactly this form: `APPROVED FOR RELEASE — Reviewer: <your full name> — Date: YYYY-MM-DD`. The deploy workflow checks it strictly (one record, real name, valid date, must match the name you type when running the deploy). |
| 6 | **Turn on GitHub Pages and deploy** | You (Claude can guide) | Repo **Settings → Pages → Source: GitHub Actions**. Merge the PR into `main`, then **Actions → "Deploy to GitHub Pages" → Run workflow** from `main`, entering your name exactly as in the approval line. Optional extra gate: **Settings → Environments → github-pages → Required reviewers**. |

### Recommended soon after launch

| # | Item | Notes |
|---|---|---|
| 7 | **Swap in official 2027 rates when VA publishes them** | Usually late November–December. Claude will save the new VA page, load the official table, remove the "PROJECTED" labels, and update tests and docs. |
| 8 | **Check S. 4487 status** (Veterans' COLA Act of 2026) | https://www.congress.gov/bill/119th-congress/senate-bill/4487 — Claude couldn't confirm whether it was enacted (site blocked automation). |
| 9 | **Real screen-reader test** | Try the site with iPhone VoiceOver and Android TalkBack. Automated checks passed; real-device testing hasn't been done. |
| 10 | ~~**Social share image**~~ | **DONE** — cropped from the hero image (`public/og-image.jpg`) and wired into the page's share tags. A custom version with empty space for text is still optional. |

### Known limitations (shown honestly on the site — candidates for future features)

| Situation | Current behavior | What it would take to support |
|---|---|---|
| Special Monthly Compensation (SMC) | Warning, no number | Load VA's official SMC tables and add SMC level selection |
| All children are 18–23 and in school (none under 18) | Warning, no number | An official VA statement on how to price this case; VA's rate page doesn't say |
| Adult child VA recognized as permanently incapable of self-support ("helpless child") | Yes/no control; warning and **no totals** at 30–100% (complete total at 10/20%, where dependents never count) | The official VA rate rule for this child, cited from VA.gov, plus tests |
| Bilateral factor for paired muscles other than arms/legs | Not modeled | More detailed body-location inputs |
| Amputation rule (38 CFR 4.68) | Not modeled | Body-part grouping logic |
| More than 16 arm/leg conditions in the bilateral group | Explicit "can't calculate" message | Faster search algorithm |
| TDIU | Explained; never assumed. User selects 100% only if VA granted it | — (by design) |

---

## 8. Brainstorm ideas for ChatGPT (optional)

Good topics to explore — anything chosen comes back to Claude to build and verify:
- Short, warm microcopy for buttons, empty states and warnings (keep it plain and respectful).
- A "Thank you for your service" footer line or rotating quotes from veterans (no real names without permission).
- Ideas for an FAQ section (e.g. "When is VA compensation paid?", "Is VA disability taxable?") — every answer must cite VA.gov.
- A future "Survivors (DIC)" calculator — would need VA's official DIC tables.
- A Spanish-language version.
- A printable one-page summary design.

---

## 9. What to send back to Claude

Reply in the Claude session with any of:
- "Hero image uploaded" + alt text (and `og-image.jpg` if made).
- Your COLA confirmation (item 2) and link check (item 4).
- Your review notes and approval line (items 3 and 5).
- Any brainstorm ideas you want built — Claude will verify every number against official VA sources before adding it.
