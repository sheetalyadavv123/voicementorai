export interface PreferencesPatch {
  preferredLanguage?: "en" | "hi" | "hinglish";
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
  voiceId?: string;
  responseLength?: "concise" | "balanced" | "detailed";
}

export async function updatePreferences(patch: PreferencesPatch) {
  const response = await fetch("/api/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to save settings");
  }
  return response.json();
}
