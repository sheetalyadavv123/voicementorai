# Architecture

## The voice loop

```
User speaks
    │
    ▼
Microphone (browser, via @livekit/components-react)
    │
    ▼
LiveKit (WebRTC transport — handles the audio stream, room, participants)
    │
    ▼
Deepgram (streaming speech-to-text)
    │
    ▼
LiveKit AgentSession + openai.LLM (GPT-5.4 Mini, streaming, function-calling)
    │              │
    │              ├─▶ Tools (search_notes, generate_quiz, evaluate_answer, save_memory, ...)
    │              │        │
    │              │        ├─▶ RAG (pgvector similarity search over uploaded PDFs)
    │              │        └─▶ LangGraph (quiz question generation only)
    │              │
    ▼              ▼
ElevenLabs (streaming text-to-speech) ◀── tool results feed back into the same LLM turn
    │
    ▼
Speaker (browser, via RoomAudioRenderer)
```

Every arrow above is a streaming connection, not a request/response round trip — Deepgram emits
partial transcripts as the student talks, the LLM streams tokens as it generates, and ElevenLabs
starts synthesizing audio from the first sentence rather than waiting for the full response. This
is what makes the "low latency, natural conversation" goal achievable at all: the alternative
(batch STT → single LLM call → single TTS call) adds seconds of dead air between turns.

## Why LiveKit's own OpenAI plugin, not a hand-rolled LangGraph realtime loop

The spec's tech stack lists both LangGraph and LiveKit. The realtime audio loop — turn-taking,
voice-activity detection, barge-in/interruption, streaming token-to-audio — is genuinely hard to
get right, and LiveKit Agents already solves it (as of `livekit-agents` 1.x, with the modern
`Agent`/`AgentSession`/`function_tool` API — an earlier version of this codebase targeted the
pre-1.0 API by mistake and was corrected once the actual installed package was inspected).
Re-implementing that turn-taking state machine on top of a hand-written LangGraph node under a
multi-day deadline is a good way to ship something that mostly works and occasionally talks over
the user.

So the split is:

- **LiveKit Agents' `openai.LLM`** drives every live conversational turn — it owns the ReAct-style
  tool-calling loop (agent responds or calls a tool, tool result feeds back in, repeat until a
  final spoken answer), with LiveKit handling VAD/interruption/streaming around it.
- **LangGraph** drives the one part of the product that's genuinely a multi-step, stateful flow
  rather than a single conversational turn: generating a quiz. `agent/quiz_graph.py` is a two-node
  graph (`retrieve_context` → `generate_questions`) that a quiz-generation tool call invokes. The
  turn-by-turn "ask a question, wait for the spoken answer, evaluate it" loop *during* the quiz
  is not modeled as a graph — it can't be, because it has to block on external voice input between
  steps, which a single `graph.invoke()` call doesn't represent. That loop is ordinary tool calls
  (`generate_quiz`, `evaluate_answer`) mutating an in-memory `QuizSession` for the life of the room.

If a second, more elaborate stateful flow shows up later (say, a multi-session "study plan"
feature), the same pattern extends: model it as its own LangGraph graph, invoke it from a tool.

## Why the AI provider is a runtime toggle, not a fixed choice

`AI_PROVIDER` in `backend/.env` (`"openai"` or `"google"`) picks the provider for the live voice
LLM (`agent/worker.py`'s `build_llm()`), one-shot generation (`agent/llm.py`), and embeddings
(`rag/embeddings.py`) — all three branch on the same setting. This exists because Gemini via
Vertex AI hit persistent, unresolved `429 RESOURCE_EXHAUSTED` errors under real conversational
load even with GCP billing enabled, which is why OpenAI is the default — but the Google path is
kept fully working (not deleted) behind the toggle rather than ripped out, in case OpenAI hits its
own problems (billing, quota, outage) or Google's quota issue turns out to be transient. Both
providers' dependencies (`openai` + `google-genai`, `livekit-plugins-openai` +
`livekit-plugins-google`) are always installed so switching never needs a reinstall, only an env
var change and a restart.

## Why two Postgres schemas

Prisma (frontend, owns `users`) and Alembic (backend, owns everything else) are two independent
migration tools pointed at the same database. Early in this build, sharing the `public` schema
caused `prisma migrate dev` to detect Alembic's tables as unexplained "drift" against Prisma's own
migration history and offer to reset the whole database — which would recur on every future schema
change to `users`, forever.

The fix: `auth.users` lives in its own Postgres schema (`auth`), separate from the backend's tables
in `public`. Alembic's `env.py` (`backend/database/migrations/env.py`) explicitly excludes anything
in the `auth` schema from its own autogenerate diffing via `include_object`. Both sides still join
across the schema boundary fine — `conversations.user_id` is a normal foreign key to
`auth.users.id`; Postgres doesn't care that the two tables were created by different tools.

## Why the backend is the only place with third-party credentials

The Next.js frontend never holds a LiveKit, Deepgram, ElevenLabs, or OpenAI API key. Every call
that needs one goes: browser → Next.js API route (authenticated via the NextAuth session) →
FastAPI backend (authenticated via a shared `INTERNAL_API_SECRET` header) → the actual third-party
API. This keeps all the expensive/sensitive credentials in one process, makes key rotation a
one-place change, and means the browser bundle never ships a real API key by accident.

The one exception is `NEXT_PUBLIC_LIVEKIT_URL` — the public `wss://` room URL, which is not a
secret (a LiveKit access *token*, minted server-side per session, is what actually authorizes the
connection).

## Data model

- `auth.users` (Prisma) — identity + preferences (`preferred_language`, `difficulty_level`,
  `voice_id`, `response_length`). Read and written by both sides — only the table's *schema*
  (columns/DDL) is Prisma-exclusive; both Next.js (via Prisma) and the LiveKit worker (via
  SQLAlchemy, for `change_language`/`change_difficulty` tool calls) can update rows.
- `conversations`, `messages` — one row per voice session, one row per turn. `messages` carries
  the dashboard metrics (`input_tokens`, `output_tokens`, `latency_ms`, `estimated_cost_usd`),
  populated from LiveKit's own `LLMMetrics` events as they fire.
- `documents`, `document_chunks` — uploaded PDFs and their embedded chunks (`pgvector`, cosine
  distance, HNSW index). `document_chunks.embedding` is a 768-dimension vector (OpenAI's
  `text-embedding-3-small` truncated via Matryoshka representation learning — a good size/quality
  tradeoff for this scale of app).
- `user_memory` — arbitrary long-term facts (`save_memory`/`retrieve_memory` tools), distinct from
  the structured profile fields on `users`.
- `quiz_attempts` — one row per quiz question answered, for scoring and dashboard history.
