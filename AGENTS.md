# in-lighttherapy

## Project overview

In-Light Therapy practice web app: Vite + React + TypeScript + Tailwind, Firebase (Hosting, Auth, Firestore, Storage, Functions). Premium, serene, mobile-first marketing site with membership, newsletter, clinician pages, tools CMS, contact, and queue-based chat.

- Firebase project ID: `in-lighttherapy`
- Production domain (later): `in-lighttherapy.com`
- Current hosting target: `https://in-lighttherapy.web.app`
- Hosting: classic Firebase Hosting SPA only (App Hosting not used)
- GitHub: `inlightadmin/inlighttherapy` (commits as In-Light Admin / inlightadmin@gmail.com on this machine)
- Practice email (public / contact): `s3an1amb@gmail.com`
- Developer / Firebase / SendGrid account: `inlightadmin@gmail.com`
- Phone: `801-318-3396`

## Roles

`USER < CLIENT < CLINICIAN < PUBLICIST < ADMIN`

- Default role: USER (newsletter)
- Promote to CLIENT on: chat opt-in, SMS opt-in, or Calendly booking webhook
- Chat: CLIENT ↔ CLINICIAN+ only; staff join queue; no client↔client
- PUBLICIST: clinician pages, tools, quotes, site CMS, business hours, clinician availability overrides
- ADMIN: all of the above + user/role management

## Commands

```bash
npm install
npm run dev
npm run build          # prebuild regenerates sitemap + robots
npm run sitemap
npm run preview
```

Functions:

```bash
cd functions && npm install && npm run build
```

## Code style

- TypeScript strict; functional React components
- Path alias `@/` → `src/`
- Prefer small focused modules; placeholder content in `src/lib/content.ts` until CMS is live
- Never commit `.env.local` or secrets
- Mobile-first UI; respect `prefers-reduced-motion`

## Safety / compliance

- No PHI in chat or clinical records in this app
- Always show crisis disclaimer / 988 where chat or support is offered
- Consent checkboxes at signup (Terms, Privacy, optional SMS/chat)
- Security rules must not allow client role escalation

## PR / commits

- Clear complete-sentence commit messages
- Do not force-push `main` without explicit approval
