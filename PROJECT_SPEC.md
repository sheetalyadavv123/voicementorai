# Voice Mentor AI
*A production-ready, voice-first AI tutor inspired by products like SuperKalam.*

---

# Overview

Build a modern, production-quality AI Voice Tutor that allows students to have natural conversations with an AI mentor.

The application should feel like talking to a real teacher instead of a chatbot.

The focus should be on:

- Natural conversations
- Low latency
- High quality UI/UX
- Production-ready architecture
- Modular codebase
- Clean developer experience
- Extensible AI pipeline

The codebase should be something that could realistically be shipped by an early-stage startup.

---

# Primary Goal

The AI should be able to:

- Answer questions naturally
- Teach concepts
- Ask follow-up questions
- Quiz the student
- Evaluate answers
- Retrieve information from uploaded notes
- Remember previous conversations
- Speak naturally
- Allow interruptions while speaking
- Switch between Hindi and English

The application should feel conversational rather than prompt-response based.

---

# Tech Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- TanStack Query
- Framer Motion

---

## Backend

- FastAPI
- Python 3.12
- Pydantic
- Uvicorn

---

## AI

- LangGraph
- Gemini 2.5 Flash
- Gemini Embeddings

---

## Voice

- LiveKit
- Deepgram Streaming STT
- ElevenLabs Streaming TTS

---

## Database

- PostgreSQL

Use pgvector for embeddings.

---

## Storage

- Google Cloud Storage

---

## Deployment

Frontend

- Vercel

Backend

- Google Cloud Run

---

# Architecture

```
User

↓

Microphone

↓

LiveKit

↓

Deepgram STT

↓

LangGraph Agent

↓

RAG (optional)

↓

Tool Calls (optional)

↓

Gemini

↓

ElevenLabs

↓

Speaker
```

---

# MVP Features

## Authentication

- Login
- Logout
- Session persistence

---

## Voice Chat

- Start conversation
- Stop conversation
- Push to talk
- Continuous conversation
- Streaming responses

---

## Conversation

- AI greets user
- AI remembers context
- AI asks follow-up questions
- AI keeps conversation flowing naturally

---

## RAG

Allow users to upload PDFs.

Examples:

- Notes
- Books
- Study material

The AI should answer using uploaded documents whenever relevant.

Responses should include citations.

---

## Memory

Remember:

- User name
- Previous conversations
- Previous topics
- Preferred language
- Difficulty level

---

## Language Support

Support

- English
- Hindi
- Hinglish

User should be able to switch anytime.

---

## Dashboard

Display:

- Conversation history
- Uploaded notes
- Total conversations
- Token usage
- Estimated cost
- AI provider
- Response latency

---

# Tool Calling

Create tools for:

search_notes()

generate_quiz()

evaluate_answer()

summarize_document()

translate_response()

change_language()

change_difficulty()

save_memory()

retrieve_memory()

---

# Quiz Mode

The user can say

> Quiz me on Mughal Empire.

The AI should

- Generate questions
- Wait for answers
- Evaluate responses
- Give explanations
- Calculate score

---

# Teaching Mode

The AI should

Explain topics gradually.

Not dump large paragraphs.

Teach like a real mentor.

Break concepts into small chunks.

Ask

"Did you understand?"

before continuing.

---

# Conversation Flow

Example

AI:

Hi Lakshay!
What would you like to study today?

↓

User speaks

↓

Speech converts to text

↓

Agent understands intent

↓

Optional retrieval

↓

Optional tool calls

↓

Generate response

↓

Convert response to speech

↓

Play response

↓

Repeat

---

# Voice Features

Implement:

- Streaming STT
- Streaming TTS
- Interrupt AI while speaking
- Auto detect silence
- Natural pauses
- Voice activity detection

---

# UI Pages

Landing Page

Login

Dashboard

Voice Chat

Conversation History

Settings

---

# Landing Page

Include:

Hero Section

Features

Architecture

How it Works

Footer

Responsive Design

---

# Chat Screen

Should contain

Microphone button

Stop button

Conversation transcript

Streaming text

Speaking animation

Listening animation

AI status

Latency indicator

---

# Settings

Allow users to change

Voice

Language

Theme

Model

Response length

---

# Nice UI Details

Typing animation

Wave animation

Glassmorphism

Dark mode

Responsive layout

Rounded components

Smooth transitions

Professional spacing

Modern fonts

Loading skeletons

Toast notifications

---

# Error Handling

Handle

Microphone permission denied

Network disconnect

Model timeout

Empty response

API failure

Invalid upload

Reconnect automatically whenever possible.

---

# Performance

Optimize for

Low latency

Streaming

Fast first response

Reusable components

Lazy loading

Minimal re-renders

---

# Folder Structure

```
app/

components/

features/

hooks/

lib/

services/

types/

backend/

agent/

tools/

memory/

rag/

prompts/

database/

uploads/
```

---

# Coding Standards

- Use TypeScript wherever possible.
- Use reusable components.
- Keep business logic separate from UI.
- Avoid duplicated code.
- Use meaningful variable names.
- Prefer composition over large files.
- Use environment variables.
- Add comments where necessary.
- Handle loading and error states.
- Write modular services.

---

# Stretch Goals

Conversation analytics

Prompt versioning

Study planner

Flashcards

Voice cloning

Emotion detection

Teacher mode

Exam mode

MCQ practice

Daily streaks

Leaderboards

Conversation summaries

---

# Deliverables

The final project should include

- Complete source code
- README
- Environment setup guide
- Architecture diagram
- Deployment guide
- Example screenshots
- Production-ready UI
- Clean commit history
- Loom demo

---

# Development Philosophy

Build this as if it were a real startup product.

Prioritize:

- Clean architecture
- Modular code
- Great UI/UX
- Low latency
- Natural conversations
- Production-quality code
- Maintainability
- Scalability

Avoid shortcuts that make the project difficult to extend later.

Every major feature should be built in a reusable way so future capabilities (new tools, models, languages, or workflows) can be added with minimal changes.
