# Deployment Guide — accounting-frontend

Operator runbook for `accounting-frontend` (Next.js 16 + React 19 + TypeScript). Covers build process, server setup, PM2, reverse proxy, logs, and rollback.

The backend has its own deploy guide at `accounting-backend/docs/deployment.md`. The two services are deployed independently but the frontend's API origin must be reachable from the user's browser (CORS + Sanctum SPA cookie domain — see backend guide §3).

---

## Stack at a glance

- **Runtime:** Node.js 20+ (LTS recommended)
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Auth:** Sanctum SPA cookies (set by the Laravel backend)
- **Process manager:** PM2 (recommended) or systemd
- **Reverse proxy:** Nginx (recommended) or Caddy

The frontend is **stateless** — it has no DB, no queue, no scheduler. Deploying is build → upload → restart.

---

## 1. Prerequisites

On the deployment server:

```bash
# Node.js 20+ (use NodeSource or nvm)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Verify
node -v && npm -v

# PM2 (process manager)
sudo npm install -g pm2

# Nginx (reverse proxy + TLS termination)
sudo apt install nginx
```

On your build machine (CI or laptop): same Node version + ability to `npm ci`.

---

## 2. Build process

The frontend uses **Next.js standalone output is NOT enabled** by default — `npm start` runs `next start` which needs the full project. Build on a machine with the same Node major version as the server.

```bash
cd /path/to/accounting-frontend
npm ci                                       # exact lockfile install
npm run build                                # produces .next/
```

Successful build ends with `Compiled successfully` and emits `.next/`.

If `npm ci` fails on peer-dep conflicts, debug them — don't use `--legacy-peer-deps` permanently. Pin or upgrade the offending dep.

---

## 3. Environment variables

The frontend ships with `.env.local` for development. **Production must use a separate file** — either `.env.production` (Next reads it for `next build`) or environment variables set by the process manager.

Required production keys:

```bash
# Backend API base — what the BROWSER calls (must be reachable from end users)
NEXT_PUBLIC_API_URL=https://api.accounting.example.com/api/v1
NEXT_PUBLIC_SANCTUM_URL=https://api.accounting.example.com
```

Notes:

- `NEXT_PUBLIC_*` vars are **inlined at build time**. Changing them requires a rebuild + redeploy. Don't try to swap them at runtime.
- For Sanctum SPA auth to work, the API and the frontend must share a registrable domain (e.g., `app.example.com` + `api.example.com` → both use cookie domain `.example.com`). Cross-site cookies (different registrable domains) need `SameSite=None; Secure` and modern browser support.
- `proxy.ts` (Next middleware) checks for the presence of `laravel_session`, `accounting_td_session`, or `XSRF-TOKEN` cookies as a coarse "is the user authed" gate before a real `/me` check on the page. The actual session cookie name varies based on the backend's `APP_NAME` (e.g., `sample-acc-session` if `APP_NAME=sample-acc`). Update `proxy.ts`'s cookie list if the production backend uses a different name.

---

## 4. Initial server setup (one-time)

### 4.1 Create deploy target dir

```bash
sudo mkdir -p /var/www/accounting-frontend
sudo chown -R deploy:deploy /var/www/accounting-frontend
```

### 4.2 Nginx site (example)

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name accounting.example.com;

    # Static assets — let Next.js serve them (it sends correct cache headers)
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache /_next/static/* aggressively (immutable, content-hashed)
    location /_next/static/ {
        proxy_pass http://nextjs;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    client_max_body_size 20M;
}
```

Enable HTTPS via certbot. Sanctum SPA cookies require `Secure` cookies in production — the frontend MUST be served over HTTPS.

### 4.3 PM2 setup

After the first successful upload + `npm ci`:

```bash
cd /var/www/accounting-frontend
pm2 start npm --name "accounting-frontend" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
# Run the systemd command pm2 prints, then:
pm2 save
```

Verify:

```bash
pm2 list                        # status: "online"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
# Expect 200 (login page) or 307 (redirect to /login)
```

---

## 5. Deploy

There is **no Jenkins pipeline for the frontend** today (only the backend has one). Two options:

### 5.1 Manual rsync deploy

Build locally or in CI, then rsync:

```bash
# On your laptop / CI runner
npm ci
npm run build

# Sync the build artifacts + minimal runtime files
rsync -avz --delete \
      --exclude=node_modules \
      --exclude=.git \
      --exclude=test-results \
      --exclude=playwright-report \
      .next public package.json package-lock.json next.config.ts \
      deploy@<server>:/var/www/accounting-frontend/

# Then on the server
ssh deploy@<server>
cd /var/www/accounting-frontend
npm ci --omit=dev               # production deps only
pm2 reload accounting-frontend  # zero-downtime reload
```

`pm2 reload` (vs `restart`) keeps the old worker serving requests until the new one is ready — effectively zero-downtime.

### 5.2 Build-on-server deploy

Slower (server runs the build) but simpler — no artifact transfer:

```bash
ssh deploy@<server>
cd /var/www/accounting-frontend
git pull origin main            # requires server-side checkout
npm ci
npm run build
pm2 reload accounting-frontend
```

If you go with this, set up a server-side git remote pointing to the GitHub repo and use a deploy key for read-only access.

### 5.3 (Future) CI/CD

When you outgrow manual deploys, mirror the backend pattern:

- `Jenkinsfile` at the frontend repo root with branch → environment mapping
- A `scripts/deploy.sh` that runs `npm ci --omit=dev && pm2 reload accounting-frontend`
- Discord notifications via the same webhook as the backend

Out of scope until the operational load warrants it.

---

## 6. Logs & troubleshooting

| What | Where |
|---|---|
| Next.js / app logs | `pm2 logs accounting-frontend` (or `~/.pm2/logs/accounting-frontend-*.log`) |
| Nginx access/error | `/var/log/nginx/{access,error}.log` |
| Build artifacts | `.next/` — inspect for missing chunks if pages 404 |
| Browser console | F12 → Console — most auth issues show up here as 401/CORS errors |

**Quick health check:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://accounting.example.com/login
# Expect 200
```

**Common issues:**

| Symptom | Likely cause |
|---|---|
| Login redirects back to `/login` after submit | Backend's `SANCTUM_STATEFUL_DOMAINS` doesn't include the frontend hostname; or session cookie domain mismatch |
| 401 on every API call | `NEXT_PUBLIC_API_URL` points at wrong host, OR cookie not being sent (CORS + `credentials: 'include'` + cookie domain) |
| Login form click does nothing | `.next/` cache is stale — `rm -rf .next && npm run build && pm2 reload accounting-frontend` |
| HMR loop spam in dev only | `.next/` migrated from a different filesystem path — clear it |
| 502 Bad Gateway from Nginx | PM2 process crashed or never started. `pm2 list` and `pm2 logs accounting-frontend` |
| 504 Gateway Timeout | Backend slow / down. Check `accounting-backend` health (curl `https://api…/sanctum/csrf-cookie`) |
| Mixed content warnings | `NEXT_PUBLIC_API_URL` is `http://` while the frontend is on `https://`. Both must be HTTPS |

---

## 7. Rollback

PM2 doesn't keep prior builds. Rollback is build-the-old-commit + redeploy:

### 7.1 Rebuild from a previous tag/SHA

```bash
# On your laptop / CI runner
git checkout <last-known-good-sha>
npm ci
npm run build
rsync ... deploy@<server>:/var/www/accounting-frontend/   # same flags as §5.1
ssh deploy@<server> "cd /var/www/accounting-frontend && npm ci --omit=dev && pm2 reload accounting-frontend"
```

### 7.2 Faster: keep N prior builds on the server

If you want instant rollback without rebuild, switch to a release-dir layout:

```
/var/www/accounting-frontend/
├── current → releases/2026-04-29-191045
└── releases/
    ├── 2026-04-29-191045/  ← live
    ├── 2026-04-22-080012/  ← previous
    └── 2026-04-15-114455/
```

PM2 runs from `/var/www/accounting-frontend/current/`. Atomically swap the symlink to roll back:

```bash
cd /var/www/accounting-frontend
ln -nfs releases/2026-04-22-080012 current
pm2 reload accounting-frontend
```

This needs a rewrite of the rsync target in §5 to drop into a timestamped releases subdir. Worth doing once you're past the prototype phase.

---

## 8. Smoke test after deploy

After every deploy, verify before walking away:

1. **App loads:** `curl -sI https://accounting.example.com/login` → `200 OK`.
2. **Login works:** browser → `/login` → enter valid creds → lands on `/`.
3. **API reachable:** browser DevTools → Network tab → `/api/v1/me` after login → `200`.
4. **PM2 alive:** `pm2 list` shows `online` and `restarts` count is stable.
5. **Nginx healthy:** `sudo nginx -t` (config OK) and `sudo systemctl status nginx` (active).

---

## See also

- `proxy.ts` — Next middleware that gates protected routes by cookie presence
- `lib/api/client.ts` — fetch wrapper with credentials + CSRF handling
- `lib/auth/AuthProvider.tsx` — React context for auth state and login/logout
- `accounting-backend/docs/deployment.md` — backend deploy guide
- `docs/superpowers/specs/2026-04-19-admin-auth-and-audit-log-design.md` — auth architecture
