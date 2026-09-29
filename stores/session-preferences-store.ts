import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "hi" | "hinglish";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface SessionPreferencesState {
  language: Language;
  difficultyLevel: DifficultyLevel;
  setLanguage: (language: Language) => void;
  setDifficultyLevel: (level: DifficultyLevel) => void;
  hydrate: (prefs: { language: Language; difficultyLevel: DifficultyLevel }) => void;
}

// Shared between the Settings and Chat pages so a change in one is
// reflected in the other without a refetch. Seeded from the user's saved
// profile on first load (see hydrate), then kept client-side.
export const useSessionPreferencesStore = create<SessionPreferencesState>()(
  persist(
    (set) => ({
      language: "en",
      difficultyLevel: "beginner",
      setLanguage: (language) => set({ language }),
      setDifficultyLevel: (difficultyLevel) => set({ difficultyLevel }),
      hydrate: (prefs) => set(prefs),
    }),
    { name: "voice-mentor-session-preferences" }
  )
);
