# LyricVenture Instructions

## Purpose
LyricVenture is a Next.js App Router project for song, artist, album, and lyric analysis browsing with Supabase.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage)

## Key Folders
- src/app: Routes and layouts (public, admin, api)
- src/components: UI, public, and admin components
- src/lib: Supabase clients, types, helpers
- supabase/migrations: SQL schema and seed data

## Required Environment Variables
Create .env.local in the project root with at least:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Common Scripts
- npm run dev: Start dev server
- npm run build: Production build
- npm run start: Run production server
- npm run lint: Lint

## Docker Usage
Build and run with Docker Compose:
- docker compose up --build

Run container directly:
- docker build -t lyric-venture .
- docker run --env-file .env.local -p 3000:3000 lyric-venture

## Notes
- Supabase migrations live in supabase/migrations.
- Public pages are in src/app/(public).
- Admin pages are in src/app/(admin).

## Cron Jobs

Cron jobs menjaga Supabase free tier tidak di-pause (batas: 7 hari inaktif).

### API Endpoints

| Endpoint | Jadwal Docker | Jadwal GitHub Actions | Fungsi |
|---|---|---|---|
| `GET /api/cron/keep-alive` | setiap 10 menit | 2x sehari (6:00 & 18:00 UTC) | Ping Supabase |
| `GET /api/cron/stats-snapshot` | tengah malam | 1x sehari (6:00 UTC) | Snapshot statistik |
| `GET /api/cron/cleanup-drafts` | Minggu jam 3 pagi | Setiap Minggu | Hapus draft > 90 hari |

Semua endpoint memerlukan header: `Authorization: Bearer <CRON_SECRET>`

### Setup CRON_SECRET

Tambahkan ke `.env.local`:
```
CRON_SECRET=f2d1fa629f261ad6134483f14bb262ecb4eed602b0586939ad322e2d0edf8a34
```

### Setup GitHub Actions

Tambahkan 2 secrets di GitHub repo → Settings → Secrets and variables → Actions:
- `CRON_SECRET` = nilai yang sama dengan `.env.local`
- `APP_URL` = URL production kamu (contoh: `https://yourdomain.com`)

### Docker (lokal/VPS)

Saat `docker compose up`, service `cron` otomatis berjalan dan ping setiap 10 menit.
Hanya aktif selama Docker berjalan.

### Test Manual

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/keep-alive
```
