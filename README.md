# Home

A family home app. Version 1 has one section: **Inventory** — what we own, and in which home
(Tel Aviv, Evia, Deal). Built to grow: lists, tasks, a calendar and more can be added as new sections.

👉 **First time? Follow [docs/SETUP.md](docs/SETUP.md).** Ideas for later: [docs/BACKLOG.md](docs/BACKLOG.md).

## What it does
- Sign in with Google (only emails on the family list get in), shared data for everyone in the family
- Gallery of items, filter by home, category, sub-category
- Search across all homes ("where is the blender?")
- Quick add: take a photo → AI guesses name, category, sub-category, color and notes → you confirm
- AI turns the photo into one small, simple picture; the photo itself is never kept
- Pictures are optional (switch it off for socks): items without one show a color tile
- Move an item to another home, edit, delete
- Add, rename, archive homes
- Installable on phone, laptop and tablet (PWA); works with a weak connection

## Tech
- **React + Vite + TypeScript** — the most widely used, best-documented setup for a small web app; builds to a static site that GitHub Pages can host.
- **Firebase**: Authentication (Google), Firestore (data; also photos on the free plan), Storage (photos on the paid plan), AI Logic (Gemini, for guessing details and making images — no server or secret key needed).
- **GitHub Pages** via GitHub Actions: every push to `main` deploys automatically.

## Folder structure
```
src/
  main.tsx                 start-up
  app/                     the app shell, shared by all sections
    App.tsx                sign-in gate
    Shell.tsx              top bar + section navigation
    sections.ts            ← list of sections; add new ones here
    sectionTypes.ts
  core/                    shared building blocks any section can use
    firebase/config.ts     ← your Firebase settings go here
    firebase/app.ts
    auth/                  Google sign-in + family access check
    ai/gemini.ts           ask Gemini for JSON or an image
    ai/models.ts           ← which Gemini models to use
    images/resize.ts
    ui/                    small shared UI pieces
  sections/
    inventory/             everything for the inventory section
      index.tsx            section definition + its pages
      types.ts, taxonomy.ts (categories, default homes)
      data/                reading/writing homes and items
      ai/                  photo guessing + AI picture (style text lives in picture.ts)
      pages/, components/
  styles/global.css
firestore.rules, storage.rules   security rules (paste into Firebase console)
docs/SETUP.md                    step-by-step setup
```

## Data
- `config/access` — `{ emails: [...] }`: who may use the app
- `homes/{id}` — `name, location, archived, sortOrder`
- `config/people` — `{ owners: [...] }`: names items can belong to (kept here, not in the code, so they stay private)
- `items/{id}` — `name, homeId, category, subcategory, color, colorHex, owner, notes, image, imageKind (ai | photo), imageStatus, createdBy, createdAt, updatedAt`
- Pictures (one small image per item, max 480px): free plan — stored inside the item document; paid plan — Storage `items/{id}/image_*.jpg` (setting: `photoStorage` in `config.ts`)

## Adding a section later
1. Create `src/sections/<name>/index.tsx` that exports an `AppSection` (id, title, icon, path, Component).
2. Add it to `src/app/sections.ts`. Navigation appears automatically once there are two or more sections.
3. Give it its own Firestore collections (e.g. `lists`, `tasks`). The security rules already cover them.

## Running locally (optional, for developers)
```
npm install
npm run dev
```
