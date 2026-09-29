-- Runs once when the postgres container's data volume is first created.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prisma (frontend auth tables) and Alembic (backend domain tables) manage
-- separate schemas in the same database so their migration histories never
-- collide — Prisma's drift detection otherwise treats the other tool's
-- tables as unexpected drift. See prisma/schema.prisma and
-- backend/database/migrations/env.py.
CREATE SCHEMA IF NOT EXISTS auth;
