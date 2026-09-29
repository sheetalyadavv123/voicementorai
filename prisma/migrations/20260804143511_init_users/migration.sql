-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "difficulty_level" TEXT NOT NULL DEFAULT 'beginner',
    "voice_id" TEXT,
    "response_length" TEXT NOT NULL DEFAULT 'balanced',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");
