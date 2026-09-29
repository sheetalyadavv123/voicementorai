# Voice Mentor AI

A voice-first AI tutor. You talk, it teaches, quizzes, remembers you, and answers from your own
uploaded notes — in English, Hindi, or Hinglish.

- **Product spec:** [PROJECT_SPEC.md](./PROJECT_SPEC.md)
- **Architecture (deep dive):** [docs/architecture.md](./docs/architecture.md)
- **Deployment guide:** [docs/deployment.md](./docs/deployment.md)
- **Local setup:** [docs/setup.md](./docs/setup.md)

## What's here

| Feature | Status |
|---|---|
| Auth (signup/login/session persistence) | Done — NextAuth v5, JWT sessions, bcrypt |
| Voice loop (STT → agent → TTS, barge-in, VAD) | Done — verified live with real LiveKit/Deepgram/ElevenLabs/OpenAI keys |
| RAG (PDF upload → chunk → embed → cited answers) | Done — verified end-to-end including the OpenAI embedding call |
| Memory (name, topics, language, difficulty) | Done |
| Quiz mode (generate → ask → evaluate → score) | Done — LangGraph-driven generation |
| Teaching mode (gradual explanations, "did you understand?") | Done — prompt-driven |
| Dashboard (history, notes, tokens, cost, latency) | Done |
| Settings (language, difficulty, voice, response length, theme) | Done |
| Landing page | Done |

Everything above was built and tested against a real local Postgres database, a real browser
session, and a real live voice round-trip (LiveKit + Deepgram + ElevenLabs + OpenAI). See
[docs/setup.md](./docs/setup.md) for where to get each key.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, Zustand, TanStack Query, Framer Motion |
| Backend | FastAPI, Python 3.12, Pydantic, Uvicorn |
| AI | LangGraph, OpenAI GPT-5.4 Mini, OpenAI text-embedding-3-small |
| Voice | LiveKit Agents, Deepgram (STT), ElevenLabs (TTS) |
| Database | PostgreSQL + pgvector |
| Storage | Google Cloud Storage (local disk fallback in dev) |
| Deployment | Vercel (frontend), Google Cloud Run (backend + voice worker) |

## Quickstart

```bash
# 1. Postgres (with pgvector)
docker compose up -d postgres

# 2. Frontend
cp .env.example .env               # fill in NEXTAUTH_SECRET, BACKEND_INTERNAL_API_SECRET
npm install
npm run db:migrate                 # Prisma: creates the `auth.users` table
npm run dev                        # http://localhost:3000

# 3. Backend (separate terminal)
cd backend
cp .env.example .env               # must share DATABASE_URL + INTERNAL_API_SECRET with the frontend's .env
make install
make migrate                       # Alembic: creates the domain tables
make dev                           # http://localhost:8000

# 4. Voice worker (separate terminal, once you have LiveKit/Deepgram/ElevenLabs/OpenAI keys)
cd backend
make worker
```

Full details, including where to get each API key, are in [docs/setup.md](./docs/setup.md).

## Why the architecture looks the way it does

A few decisions aren't obvious from the file tree alone — see
[docs/architecture.md](./docs/architecture.md) for the reasoning, but briefly:

- **Two schemas, one Postgres database.** Prisma owns `auth.users`; FastAPI/Alembic owns everything
  else in `public`. Sharing one schema between two migration tools causes constant drift-detection
  conflicts — splitting by schema removes the problem entirely rather than working around it.
- **LiveKit's own OpenAI plugin drives the live conversation; LangGraph drives quiz generation.**
  The realtime STT→LLM→TTS loop (interruption handling, VAD, streaming) is handled by LiveKit
  Agents' own `openai.LLM` integration rather than hand-rolled — that's proven, low-latency code
  nobody should rewrite under time pressure. LangGraph is used where it earns its place: the
  multi-step "retrieve notes → generate questions" flow behind quiz mode.
- **The backend is the only thing holding third-party secrets.** The Next.js frontend never sees
  LiveKit/Deepgram/ElevenLabs/OpenAI credentials — it calls its own API routes (a thin BFF layer),
  which call FastAPI with a shared internal secret.

## Project structure

```
app/                  Next.js App Router pages + API routes (BFF layer)
components/ui/        shadcn/ui primitives
features/             UI feature modules (voice-chat, dashboard, history, settings, notes, auth, landing)
lib/                  Shared frontend utilities (auth config, prisma client, backend client)
services/             Client-side fetch wrappers per domain
stores/                Zustand stores
prisma/               Prisma schema + migrations (auth.users only)

backend/
  main.py             FastAPI app entrypoint
  api/routes/         REST endpoints (livekit token, documents, conversations, dashboard)
  agent/              LangGraph quiz flow, OpenAI client, LiveKit worker entrypoint
  tools/              The 9 agent tools (search_notes, generate_quiz, ...)
  rag/                PDF chunking, embeddings, ingestion, retrieval
  memory/             User memory read/write
  prompts/            System prompt construction
  database/           SQLAlchemy models + Alembic migrations
  uploads/             Local dev fallback storage for uploaded PDFs
```

## Known limitations (given the timeline)

- **Voice selection is a static curated list**, not a live call to ElevenLabs' voice library.
  Swapping in a real `GET /v1/voices` call is a small addition.
- **"AI model" in Settings is a locked single-option dropdown.** Only GPT-5.4 Mini is wired up,
  matching the spec — the control is there for when a second model is added, not decorative.
- **Stretch goals were dropped entirely** (voice cloning, emotion detection, streaks, leaderboards,
  exam mode, flashcards, study planner) to protect the timeline, per explicit agreement before
  building.
