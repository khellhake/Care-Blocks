# Care Blocks

A small, phone-friendly app the family uses to coordinate in-home care after Rick's bone marrow transplant.

- **1-week care blocks** across a care window you set (start and end dates, adjustable later). The block length can be changed in Settings.
- **Sign up** for a block as Kevin, Brian, Angie, or **Other** (type any name).
- **Green** = covered, **gray dashed** = open, **amber** = the caregiver has unavailable dates during that block.
- **Timeline rail:** the tall slider on the right shows every block as a square. Drag it or tap a square to jump ahead.
- **Unavailable dates:** anyone can add blockout dates for anyone. They show on each block and in the sign-up sheet.
- **Care Guide:** a pop-up that explains what a caregiver does. You can edit it in Settings.
- **Message banner:** an optional red banner at the top, e.g. "No visitors please". Hidden unless turned on.
- **Settings** (care dates, banner, guide, caregiver list) are protected by a shared family passcode. You create it the first time you open Settings.

> The passcode only guards against accidental changes; it is not real security. Anyone with the app link can view the schedule and sign up.

## Run it locally

```bash
npm install
npm run dev
```

If Firebase isn't configured, the app runs in **local mode**: everything is saved only in that browser. This is handy for trying it out.

## Live site (Firebase + GitHub Pages)

The live site is **https://khellhake.github.io/Care-Blocks/**. Every push to `main` rebuilds and redeploys it.

- **Database:** Firebase project `careblocks-8b77e` (Firestore). The rules in [`firestore.rules`](firestore.rules) are pasted into Firestore → Rules in the Firebase console.
- **Firebase web config:** lives in [`.env.production`](.env.production). This config isn't secret, since it ships inside the page anyway. Access is controlled by the Firestore rules.
- **Hosting:** the workflow in `.github/workflows/deploy.yml` builds the app and publishes it to GitHub Pages. In the repo settings, Pages → Source must be set to **GitHub Actions**. Don't click **Configure** on any workflow that the Pages screen suggests: the repo already has its own, and the suggested "Static HTML" one would publish the unbuilt source (a blank page).
- **Local development:** `npm run dev` stays in local mode. To develop against the real database, copy `.env.production` to `.env.local`.

**First visit after going live:** open Settings first to create the family passcode, then set the real care dates.

## Develop

```bash
npm test
```

Unit tests cover the block and date logic.

```bash
npm run build
```

Production build into `dist/`.

### Code map

| Path | What it does |
| --- | --- |
| `src/lib/blocks.ts` | Splits the care window into blocks and checks date overlaps. All dates are `YYYY-MM-DD` strings. |
| `src/data/` | Data layer: `firebaseStore` (live Firestore sync) or `localStore`. Both share the `DataStore` interface. |
| `src/data/defaults.ts` | Default settings and the default Care Guide text. |
| `src/components/` | UI: block cards, timeline rail, sign-up sheet, blockouts, guide and settings modals. |
| `src/styles/tokens.css` | Dark theme colors and the large type scale. |

**Data model.** Firestore holds three things:

- `settings/main`: the care window and app settings.
- `assignments/{blockStartDate}`: sign-ups. Each one is keyed by its block's start date, so extending the end date never disturbs existing sign-ups.
- `blockouts/{id}`: unavailable dates.
