# accounting-frontend

Next.js 14 frontend for the Timedoor internal accounting application.

## Setup

```bash
npm install
cp .env.local.example .env.local  # or copy .env.local and adjust
```

## Run

```bash
npm run dev
```

Opens at `http://localhost:3000`. Expects backend at `http://localhost:8000` (configure via `.env.local`).

## Environment

| Variable                  | Description                        |
| ------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`     | Backend API base URL               |
| `NEXT_PUBLIC_SANCTUM_URL` | Backend root URL for Sanctum CSRF  |
| `BACKEND_INTERNAL_URL`    | Server-side fetch URL (Docker only) |

## Test

```bash
npm run test        # unit tests (Vitest)
npm run test:e2e    # end-to-end (Playwright)
```

## Docker

Run alongside backend via the root `docker-compose.yml`:

```bash
cd ..
docker compose up --build
```

Frontend available at `http://localhost:3100`.

## Companion

Backend lives at [`accounting-backend/`](../accounting-backend/).
