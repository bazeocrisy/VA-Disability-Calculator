# Hero artwork — brief and status

## Status: NOT FINAL — placeholder shown on site

| Item | State |
|---|---|
| Candidate generated | Yes — Canva AI image generation, 2026-11-18, 2720 × 1536 px. Canva media `MAHbRcTK2AA` ([open in Canva](https://www.canva.com/M/MAHbRcTK2AA)); wrapped in design [DAHbRfzV-rw](https://canva.link/3bpbx6ity8qylrv). |
| Full-resolution file in repo | **No.** Canva refused export to the build session ("Not allowed to access design"), so only a 198 × 112 preview was available. |
| Human review | **Not done.** At preview size the six figures appear to wear distinct dress uniforms in front of a flag, but uniform accuracy, insignia, rank devices, and faces cannot be verified at that size. AI images commonly invent incorrect insignia and ribbons. |
| Shipped on site | Clearly labeled placeholder (`src/heroArt.ts` → `HERO_ART = null`). The site does not claim final artwork exists. |

## Requirements (acceptance checklist for any final asset)

- [ ] Six Black American service members, presented as one unified military family.
- [ ] Both men and women; varied ages and appearances; dignified, professional, no stereotypes or exaggerated features.
- [ ] Exactly one from each branch, in branch-appropriate uniform:
  - [ ] Army — Army Green Service Uniform (AGSU) or Army Service Uniform
  - [ ] Navy — Service Dress Blues or Whites
  - [ ] Marine Corps — Dress Blues (blue coat, white cover, red trim) or Service Alphas
  - [ ] Air Force — Service Dress (blue)
  - [ ] Coast Guard — Service Dress Blue (Coast Guard blue, distinct from Navy)
  - [ ] Space Force — Service Dress
- [ ] No real, identifiable people (fictional faces only).
- [ ] No incorrect insignia: prefer plain or softly out-of-focus rank/badges over invented or misplaced devices; no official seals or emblems.
- [ ] Large, correctly proportioned American flag behind them (13 stripes, blue canton, stars), dramatic but tasteful light.
- [ ] Composition leaves room for cropping to 16:9 desktop and ~4:5 mobile without cutting faces.
- [ ] Delivered as 2400 px wide JPG/WebP under 400 KB, plus written alt text.

## How to install a reviewed asset

1. Export the reviewed image from Canva (Share → Download → JPG, 2400 px wide).
2. Save as `public/hero/service-members.jpg`.
3. In `src/heroArt.ts` set:
   ```ts
   export const HERO_ART = {
     src: 'hero/service-members.jpg',
     alt: 'Six Black American service members from the Army, Navy, Marine Corps, Air Force, Coast Guard, and Space Force standing together before a large American flag.',
     reviewed: true,
   };
   ```
4. Record the reviewer and checklist result in `docs/audit.md`.
