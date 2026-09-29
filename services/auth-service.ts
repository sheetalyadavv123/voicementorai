import { signIn } from "next-auth/react";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export async function signupUser(payload: SignupPayload): Promise<void> {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create account");
  }
}

export interface LoginPayload {
  email: string;
  password: string;
  callbackUrl?: string;
}

export async function loginWithCredentials({
  email,
  password,
  callbackUrl = "/dashboard",
}: LoginPayload) {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
    callbackUrl,
  });

  if (!result || result.error) {
    throw new Error("Invalid email or password");
  }

  return result;
}
