# Care Blocks

A small, phone-friendly app the family uses to coordinate in-home care after Rick's bone marrow transplant.

- **2-week care blocks** across a care window you set (start and end dates, adjustable later).
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

## Share it with the family (Firebase + GitHub Pages)

1. **Create a Firebase project** at <https://console.firebase.google.com> (the free Spark plan is plenty).
2. **Create the database:** go to Build → Firestore Database → Create database, choose a location near you, and start in *production mode*.
3. **Paste in the rules:** go to Firestore → Rules, paste the contents of [`firestore.rules`](firestore.rules), and click Publish.
4. **Register a web app:** go to Project settings → General → Your apps → Web (`</>`), then copy the `firebaseConfig` values.
5. **For local development**, copy `.env.example` to `.env.local` and fill in those values.
6. **For hosting:**
   - In the GitHub repo, go to Settings → Secrets and variables → Actions. Add each `VITE_FIREBASE_*` value from `.env.example` as a repository secret.
   - In Settings → Pages, set Source to **GitHub Actions**.
   - Push to `main` (or run the workflow manually). The site is published at `https://<your-user>.github.io/Care-Blocks/`.

   The Firebase web config isn't secret (it ships in the page anyway). Storing it as secrets just keeps it out of the code.

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
