/**
 * Server-only client for calling the FastAPI backend. Every backend route
 * requires the internal shared secret (see backend/core/security.py) —
 * this is why these calls only ever happen from Next.js server code
 * (route handlers, server components), never directly from the browser.
 */
import "server-only";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.BACKEND_INTERNAL_API_SECRET ?? "";

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "X-Internal-Api-Key": INTERNAL_SECRET,
    },
    cache: "no-store",
  });
}

export async function backendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await backendFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Backend request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}
