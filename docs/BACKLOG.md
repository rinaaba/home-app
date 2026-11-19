# Backlog

Ideas and feature requests for later. Newest at the top of each list.

## Feature requests
- **Kids permissions** — kids can sign in with their own email, but with limited rights
  (for example: view and search everything, add items, but not delete items or manage homes).
  Today everyone on the family list (`config/access → emails`) can do everything.

## Later sections of the home app
- Babysitter calculator
- Lists
- Tasks
- Calendar

## To decide or set up later
- Picture style for AI pictures (currently a simple flat illustration on white; see `src/sections/inventory/ai/picture.ts`)
- Upgrade to the pay-as-you-go plan to turn on AI pictures (steps in `docs/SETUP.md` → Upgrade later)
- **App Check — deadline Jan 21, 2027:** Firebase will turn on App Check enforcement for AI Logic automatically then,
  and the AI would stop working without it. Uses reCAPTCHA Enterprise (`appCheckSiteKey` in `config.ts`); register it in Firebase App Check, then enforce.
