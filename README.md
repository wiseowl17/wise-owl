# Wise Owl

Web design studio of Manuel Lorenzo Cruz.

- Public site: landing page, contact, onboarding (`/onboard`)
- Hidden rates + agreement: `/p/wise-owl`
- Studio (owner only): `/login` → `/studio`

## Studio backend

- Database: Neon Postgres, project "Wise Owl". Branch `production` for the live
  site, branch `dev` for local work.
- API: `api/studio.ts` is one Vercel serverless function (`POST /api/studio`).
  It checks the owner's email/password on the server and sets a signed,
  HttpOnly session cookie (30 days). Public forms (contact, onboarding brief,
  agreement) save to the database and are also emailed through FormSubmit.
- Schema: `migrations/*.sql`, applied by `scripts/migrate.mjs` during
  `npm run build` whenever `DATABASE_URL` is set.

Vercel environment variables (Production and Preview):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (`production` branch) |
| `SESSION_SECRET` | 64 random hex characters |
| `STUDIO_PASSWORD_HASH` | optional: sha256 hex of `email\npassword`, to change the password |

## Local

Create `.env.local` with `DATABASE_URL` (Neon `dev` branch) and `SESSION_SECRET`, then:

```bash
npm install
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

The dev server serves `/api/studio` from the same file Vercel deploys.
