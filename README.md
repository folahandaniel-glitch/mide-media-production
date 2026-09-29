# MIDE MEDIA PRODUCTION — Website & CMS

Premium cinematography website with a full content-management backend.
**Powered and maintained by Fodan Softnet Inc (08067578112).**

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4
- **Database:** libSQL / SQLite via Drizzle ORM (local file in development, [Turso](https://turso.tech) in production)
- **Media storage:** Vercel Blob in production, local `./uploads` folder in development
- **Auth:** bcrypt-hashed passwords, signed httpOnly session cookies (JWT/HS256), role-based access

---

## 1. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

`npm run dev` and `npm run build` automatically:
1. apply database migrations,
2. seed initial content on an empty database (sample items are clearly labelled **Sample**),
3. create the first Super Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if no admin exists.

Backend: **`/admin`** (also `/dashboard`, and the small **BACKEND** link in the footer).

## 2. Deploy to Vercel

1. Push this folder to a GitHub repository (the `.gitignore` already excludes `.env*`, the local database and uploads).
2. **Database:** create a free Turso database →
   `turso db create mide-media` → `turso db show mide-media --url` → `turso db tokens create mide-media`.
3. **Import the repo in Vercel** and add these Environment Variables:

   | Variable | Value |
   | --- | --- |
   | `AUTH_SECRET` | 48+ random characters — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `ADMIN_EMAIL` | the administrator's email |
   | `ADMIN_PASSWORD` | the administrator's password (only used to create the first admin) |
   | `DATABASE_URL` | `libsql://…turso.io` |
   | `DATABASE_AUTH_TOKEN` | Turso token |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |

4. **Storage:** in Vercel → *Storage* → create a **Blob** store and connect it to the project (this sets `BLOB_READ_WRITE_TOKEN`).
5. Deploy. The build migrates and seeds the database automatically.
6. Sign in at `/admin`, then change the password in **Admin Security**.

> The build intentionally fails on Vercel if `DATABASE_URL` is missing, so the site can never run on a throw-away database.

## 3. First steps after launch (in the backend)

1. **Website Settings → General:** upload the official logo and favicon, set the website URL.
2. **Portfolio → Projects:** add real projects, then use **Dashboard → Remove all placeholders**.
3. **Team Members:** add the real team (names, photos, bios).
4. **Hero Carousel:** replace the stock slides with MIDE MEDIA PRODUCTION footage/stills (a short muted MP4 is supported).
5. **Instagram Showcase:** add selected posts (image, caption, post URL).
6. **SEO Settings:** confirm title/description and upload a 1200×630 social-share image.
7. **Analytics:** paste a Google Analytics 4 ID (`G-…`) when available.

## 4. What the backend manages

Dashboard · Website settings · Homepage section order (drag & drop) · Custom sections (text, image, image + text, video, gallery, FAQ, CTA, statistics, announcement, sanitised HTML, portfolio/services/team/testimonial blocks) · Hero carousel · About page · Services · Portfolio projects & galleries · Portfolio categories · Team · Testimonials & moderation (pending → approve/reject/feature) · Contact enquiries (status, notes, search, filters) · Social links · WhatsApp messages · Media library · Navigation menu · Footer · SEO · Announcements · Users & roles · Admin security · Draft/Published + Preview.

## 5. Security notes

- No credentials in source code or client bundles — admin credentials come only from environment variables and are stored as bcrypt hashes.
- Admin pages protected by `src/proxy.ts` **and** re-verified on every server render/API call (session revocation, deactivated accounts).
- Mutating API requests must be same-origin (CSRF protection); `SameSite=Lax`, `HttpOnly`, `Secure` cookies.
- Rate limiting on login, contact and feedback endpoints; honeypot + timing spam traps.
- All user and admin HTML is sanitised server-side; uploaded images are re-encoded with sharp; unsafe SVGs are rejected.
- Customer emails/phone numbers are never sent to public pages.
- Security headers (HSTS, X-Frame-Options, nosniff, Referrer/Permissions-Policy); `/admin` and `/preview` are `noindex`.

## 6. Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | Code quality checks |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:studio` | Browse the database |

## 7. Project structure

```
src/
  app/(site)/        public pages (home, portfolio, project detail)
  app/admin/         backend (login + CMS panel)
  app/preview/       admin-only preview including drafts
  app/api/           public form endpoints + protected admin API
  components/        site, sections, admin and UI components
  db/                Drizzle schema + seed content
  lib/               auth, settings, content queries, sanitisation, storage
  lib/admin/         declarative CMS collections (resources.ts) + server CRUD
drizzle/             SQL migrations
scripts/setup.ts     migrate + seed + first admin
```

Adding a new CMS collection (e.g. blog, bookings, client galleries) = add a table to `schema.ts`, run `npm run db:generate`, describe it in `src/lib/admin/resources.ts`, and map it in `resourceTables` (`src/lib/admin/server.ts`) — list/edit screens, validation and API come for free.
