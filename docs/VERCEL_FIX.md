# Vercel / Production checklist (fixes “network error” / API 500)

## What we found

- Homepage (`/`) returns **200**
- APIs (`/api/manga`, `/api/genres`, `/api/auth/me`, …) return **500**
- Root cause: MongoDB client crash / missing or blocked `MONGODB_URI` on Vercel

## Fix in Vercel (required)

1. Open **Vercel** → your project → **Settings** → **Environment Variables**
2. Add (for **Production**, Preview, Development):

| Name | Example |
|------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | a long random string |
| `NEXT_PUBLIC_BASE_URL` | `https://mangawebsite.vercel.app` |

3. **Redeploy** after saving env vars (Deployments → … → Redeploy)

## Fix in MongoDB Atlas (required)

1. Atlas → **Network Access** → **Add IP Address**
2. Choose **Allow Access from Anywhere** (`0.0.0.0/0`)  
   (Vercel serverless IPs change; without this, connection fails and the app shows network/API errors)

3. Atlas → **Database Access** → user must have read/write on your DB

## Verify after deploy

Open: `https://mangawebsite.vercel.app/api/health`

- `"database": "connected"` → OK
- `"database": "missing_uri"` → add `MONGODB_URI` in Vercel
- `"database": "disconnected"` → check Atlas Network Access / URI password

## Code fixes included in this commit

- Mongo client no longer throws at **import time** (that was crashing every API with 500)
- Connection timeouts (fail in ~5s instead of hanging)
- Removed `output: 'standalone'` (Docker-only; can break Vercel APIs)
- Health route reports env + DB status clearly
- API `maxDuration` raised to 30s for cold starts
