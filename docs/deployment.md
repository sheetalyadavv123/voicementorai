# Deployment

## Overview

- **Frontend** (Next.js) → Vercel
- **Backend API** (FastAPI) → Google Cloud Run
- **Voice worker** (LiveKit agent) → Google Cloud Run, as a **second, separate service** — it is a
  long-running process, not a request/response API, so it needs `min instances: 1` (no
  scale-to-zero) and cannot share a Cloud Run service with the FastAPI app
- **Database** → any managed Postgres 16+ with the `pgvector` extension available (Cloud SQL,
  Supabase, Neon, etc.)
- **Storage** → Google Cloud Storage bucket for uploaded PDFs

## Database

Provision Postgres 16+ with `pgvector` available, then run once, connected as a superuser (or a
role with `CREATE`):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS auth;
```

(This is exactly what `backend/database/init.sql` does for local dev — replicate it manually since
managed Postgres providers don't run init scripts on an existing instance.)

Then run both migration tools once against the production `DATABASE_URL`:

```bash
npx prisma migrate deploy          # from the repo root
cd backend && alembic upgrade head  # from backend/, with DATABASE_URL pointed at prod
```

## Frontend → Vercel

1. Import the repo into Vercel, root directory = repo root (the frontend lives at the root, not in
   a subfolder).
2. Set environment variables (Vercel dashboard → Settings → Environment Variables):
   `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production domain),
   `NEXT_PUBLIC_BACKEND_URL` (the Cloud Run FastAPI URL), `BACKEND_INTERNAL_API_SECRET`,
   `NEXT_PUBLIC_LIVEKIT_URL`.
3. Deploy. Vercel runs `npm run build` automatically; `prisma generate` runs as part of `npm install`
   via Prisma's postinstall hook.

## Backend API → Cloud Run

```bash
cd backend
gcloud run deploy voice-mentor-api \
  --source . \
  --region <your-region> \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,CORS_ORIGINS='["https://your-frontend-domain.com"]' \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,INTERNAL_API_SECRET=INTERNAL_API_SECRET:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest,LIVEKIT_URL=LIVEKIT_URL:latest,DEEPGRAM_API_KEY=DEEPGRAM_API_KEY:latest,ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest,GCS_PROJECT_ID=GCS_PROJECT_ID:latest
```

A `backend/Dockerfile` isn't included yet — Cloud Run's `--source` deploy with buildpacks works for
a plain FastAPI/Uvicorn app (it detects `requirements.txt` and `main.py` automatically), but for a
tighter production image, add a `Dockerfile` that installs `requirements.txt` and runs:

```
uvicorn main:app --host 0.0.0.0 --port 8080
```

Store all secrets in Secret Manager rather than passing them as plain `--set-env-vars` — the
command above uses `--set-secrets` for exactly that reason.

## Voice worker → Cloud Run (second service)

Same image as the backend API, different entrypoint and scaling config:

```bash
gcloud run deploy voice-mentor-worker \
  --source backend \
  --region <your-region> \
  --no-allow-unauthenticated \
  --min-instances 1 \
  --command "python" \
  --args "-m,agent.worker,start" \
  --set-secrets <same as above>
```

`--min-instances 1` matters: this process holds a persistent connection to LiveKit waiting for job
dispatches, and Cloud Run's default scale-to-zero would mean the first voice chat after any idle
period fails to connect to an agent. `agent.worker start` (rather than `dev`) is LiveKit Agents'
production entrypoint — see `livekit-agents`' CLI docs for the exact production flags for your
LiveKit Cloud project.

## Storage (GCS)

```bash
gsutil mb -l <your-region> gs://your-bucket-name
```

Set `GCS_BUCKET_NAME` and `GCS_PROJECT_ID` in the backend's environment; the Cloud Run service
account needs `roles/storage.objectAdmin` on the bucket. Without these set, the backend falls back
to local disk storage (`backend/uploads/`) — fine for local dev, not durable in a container that
can be recreated at any time in production.
