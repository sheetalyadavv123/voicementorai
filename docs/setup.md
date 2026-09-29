# Local setup

## Prerequisites

- Node.js 20+ and npm
- Python 3.12
- Docker (for local Postgres) — or a Postgres 16+ instance with the `vector` and `uuid-ossp`
  extensions available
- Accounts for the voice pipeline (all have free tiers, none are required just to browse the app,
  sign up, use the dashboard, or upload notes):
  - [OpenAI Platform](https://platform.openai.com/api-keys) — API key
  - [LiveKit Cloud](https://cloud.livekit.io) — API key, secret, and project URL
  - [Deepgram](https://console.deepgram.com) — API key
  - [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) — API key

## 1. Database

```bash
docker compose up -d postgres
```

This starts Postgres 16 with `pgvector` pre-installed and runs `backend/database/init.sql`, which
creates the `vector`/`uuid-ossp` extensions and the `auth` schema (see
[architecture.md](./architecture.md) for why there are two schemas).

## 2. Frontend

```bash
cp .env.example .env
```

Fill in:

| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Already correct for the `docker compose` Postgres above |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `BACKEND_INTERNAL_API_SECRET` | Generate the same way — **must match** `backend/.env`'s `INTERNAL_API_SECRET` exactly |
| `NEXT_PUBLIC_LIVEKIT_URL` | Your LiveKit Cloud project's `wss://` URL |

```bash
npm install
npm run db:migrate   # applies prisma/migrations — creates auth.users
npm run dev           # http://localhost:3000
```

## 3. Backend

```bash
cd backend
cp .env.example .env
```

Fill in `DATABASE_URL` (same Postgres, async driver — already correct by default),
`INTERNAL_API_SECRET` (matching the frontend's), and the four provider keys
(`OPENAI_API_KEY`, `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`/`LIVEKIT_URL`, `DEEPGRAM_API_KEY`,
`ELEVENLABS_API_KEY`) once you have them.

```bash
make install    # creates backend/.venv, installs requirements.txt
make migrate     # applies Alembic migrations — creates the domain tables
make dev          # http://localhost:8000
```

Without the provider keys filled in, everything except the live voice call works: auth, dashboard,
settings, PDF upload (chunking/storage succeeds; the embedding step needs `OPENAI_API_KEY` and
will mark the document `failed` with a clear error otherwise), conversation history.

## 4. Voice worker

The LiveKit agent worker is a **separate long-running process** from the FastAPI server — it's not
an HTTP route, it's a job runner that LiveKit dispatches rooms to.

```bash
cd backend
make worker
```

Requires all four provider keys. Once running, starting a voice chat from the frontend
(`/chat` → "Start conversation") will connect to a real LiveKit room and this worker will join it.

## Switching AI providers

`AI_PROVIDER` in `backend/.env` picks the provider for everything AI-related (live voice LLM,
quiz generation/evaluation, summarization, translation, RAG embeddings) — set it to `"openai"` or
`"google"` and restart the backend + worker. Both providers' dependencies are always installed, so
no reinstall is needed either way; each provider's own settings (`OPENAI_*` / `GEMINI_*` +
`GOOGLE_*`) can stay filled in side by side and only the active one is read. Google mode defaults
to Vertex AI (`GOOGLE_USE_VERTEXAI=true`) using a service-account JSON — see the Gemini section of
`.env.example` for what to set; `GOOGLE_USE_VERTEXAI=false` switches to a plain AI Studio key
instead.

## Troubleshooting

- **`prisma migrate dev` wants to reset the database**: this means something changed outside
  Prisma's migration history in the `auth` schema specifically (not `public`, where Alembic's
  tables live — those are expected to be invisible to Prisma). If you hit this, check
  `prisma/schema.prisma`'s `@@schema("auth")` annotation is still present on `User`.
- **`alembic revision --autogenerate` proposes dropping `_prisma_migrations` or `alembic_version`**:
  check `backend/database/migrations/env.py`'s `include_object` — both are explicitly excluded by
  name as a safety net alongside the schema-based exclusion.
- **Docker can't find the daemon / `DOCKER_HOST` errors** (Colima users): run `colima start` and
  `unset DOCKER_HOST` before `docker compose` commands, or configure `DOCKER_HOST` to point at
  Colima's socket permanently.
- **`401 Unauthorized` / `invalid_api_key` from OpenAI**: double check `OPENAI_API_KEY` in
  `backend/.env` is a live key from the same OpenAI account/project you expect, and that the
  project has billing enabled — a key on a project with no payment method attached returns a
  hard auth-style error rather than a usable quota.
- **`429 RESOURCE_EXHAUSTED` on Google/Vertex under real conversational load**: this was hit
  persistently under real multi-turn voice conversations even with GCP billing confirmed enabled
  — region selection, retries, and separate AI Studio keys all only partially mitigated it, which
  is why OpenAI is the default provider (see "Switching AI providers" above — `AI_PROVIDER=openai`
  is the immediate fix if you're hitting this on the Google side). If you'd rather stay on Google
  and keep chasing it: billing status and region (`GOOGLE_CLOUD_LOCATION`, try `"us-central1"` if
  `"global"` is bad) are the two levers that actually moved it in testing on this project, more
  than SDK choice did. If OpenAI ever returns 429s for you instead: `agent/llm.py`'s one-shot calls (quiz generation, answer
  grading, summarize, translate) already retry 3x with backoff, and the realtime voice LLM's
  retry budget is set via `conn_options` in `agent/worker.py`'s `entrypoint()`
  (`APIConnectOptions(max_retry=4, retry_interval=1.5, timeout=10.0)`) — widen those first before
  assuming it's an account-level quota issue.
