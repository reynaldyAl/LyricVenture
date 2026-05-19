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
