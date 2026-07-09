# In-Light Therapy

Modern TypeScript React web application for [In-Light Therapy](https://in-lighttherapy.com) — Firebase Hosting, Auth, Firestore, Storage, Cloud Functions.

**Live (Firebase):** https://in-lighttherapy.web.app  
**Repo:** https://github.com/inlightadmin/inlighttherapy

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router
- Firebase (Auth, Firestore, Storage, **Hosting**, Functions) — classic Hosting SPA only (not App Hosting)
- SendGrid (email + SMS — wired in later phases)
- Calendly (per-clinician booking links)

## Roles (RBAC)

`USER` → `CLIENT` → `CLINICIAN` → `PUBLICIST` → `ADMIN`

- Default: **USER** (newsletter archive)
- Upgrade to **CLIENT** after chat opt-in, SMS opt-in, or Calendly booking
- **CLIENT+** can chat with **CLINICIAN+** (queue-based; no client↔client)
- **PUBLICIST+** site CMS, tools, quotes, clinician pages, business hours
- **ADMIN** users/roles + full control

## Getting started

```bash
npm install
cp .env.example .env.local
# fill Firebase web config in .env.local
npm run dev
```

### Build & sitemap

```bash
npm run build
```

`prebuild` runs `scripts/generate-sitemap.ts`, writing `public/sitemap.xml` and `public/robots.txt` (copied into `dist` on build).

### Deploy hosting

```bash
npm install -g firebase-tools   # if needed
firebase login
firebase use in-lighttherapy
npm run build
firebase deploy --only hosting
```

Firebase project ID: **`in-lighttherapy`** (see `.firebaserc`).

## Project structure

```
src/
  components/   # layout, crisis banner, tools modal, hours
  lib/          # firebase, types, placeholder content
  pages/        # public + auth + legal routes
scripts/
  generate-sitemap.ts
functions/      # Cloud Functions (TypeScript)
```

## Auth setup (Firebase console)

1. Authentication → Sign-in method → enable **Email/Password** and **Google**
2. Authorized domains: `localhost`, `in-lighttherapy.web.app`, later `in-lighttherapy.com`
3. Google Cloud Console OAuth consent + Web client IDs as prompted
4. Copy web app config into `.env.local`

## Legal / safety

- Crisis disclaimer + 988 on site
- Chat is not therapy / not crisis care / no PHI intent
- Terms & Privacy include SMS (TCPA-style) templates — have counsel review before production SMS

## License

Private practice project — all rights reserved.
