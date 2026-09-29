"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUpdatePreferences } from "@/features/settings/hooks/use-update-preferences";
import {
  useSessionPreferencesStore,
  type DifficultyLevel,
  type Language,
} from "@/stores/session-preferences-store";

// ElevenLabs' current default voice set — confirmed available on a
// free-tier API key via GET /v1/voices (older well-known IDs like "Rachel"
// have since moved behind the paid-only shared Voice Library and 402 on
// synthesis). A static list is still a simplification — see the TODO in
// docs/setup.md about proxying GET /v1/voices live instead.
const VOICE_OPTIONS = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah (mature, reassuring, female)" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice (clear, engaging educator, female)" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam (dominant, firm, male)" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel (steady broadcaster, male)" },
];

const RESPONSE_LENGTH_OPTIONS = [
  { value: "concise", label: "Concise — short, to the point" },
  { value: "balanced", label: "Balanced — natural conversation length" },
  { value: "detailed", label: "Detailed — more thorough explanations" },
] as const;

interface SettingsFormProps {
  initialLanguage: Language;
  initialDifficultyLevel: DifficultyLevel;
  initialVoiceId: string;
  initialResponseLength: "concise" | "balanced" | "detailed";
}

export function SettingsForm({
  initialLanguage,
  initialDifficultyLevel,
  initialVoiceId,
  initialResponseLength,
}: SettingsFormProps) {
  const { theme, setTheme } = useTheme();
  const { language, difficultyLevel, setLanguage, setDifficultyLevel, hydrate } =
    useSessionPreferencesStore();
  const { mutate: save } = useUpdatePreferences();

  // next-themes can't know the resolved theme during SSR, so `theme` is
  // undefined on the server and briefly on the client too — using it
  // directly in a variant/className comparison causes a hydration
  // mismatch. Only trust it once mounted.
  const [mounted, setMounted] = useState(false);

  // Seed the (persisted) client store from the DB's current values on
  // first load — covers a fresh browser/device where localStorage hasn't
  // seen this user's preferences yet.
  useEffect(() => {
    setMounted(true);
    hydrate({ language: initialLanguage, difficultyLevel: initialDifficultyLevel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Tutor</CardTitle>
          <CardDescription>How your mentor talks and teaches.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={language}
              onValueChange={(value: Language | null) => {
                if (!value) return;
                setLanguage(value);
                save({ preferredLanguage: value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="hinglish">Hinglish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty level</Label>
            <Select
              value={difficultyLevel}
              onValueChange={(value: DifficultyLevel | null) => {
                if (!value) return;
                setDifficultyLevel(value);
                save({ difficultyLevel: value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Voice</Label>
            <Select
              defaultValue={initialVoiceId}
              onValueChange={(value: string | null) => value && save({ voiceId: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Response length</Label>
            <Select
              defaultValue={initialResponseLength}
              onValueChange={(value: "concise" | "balanced" | "detailed" | null) =>
                value && save({ responseLength: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_LENGTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">App</CardTitle>
          <CardDescription>Appearance and model.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mounted && theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-1.5 h-4 w-4" />
                Light
              </Button>
              <Button
                type="button"
                variant={mounted && theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-1.5 h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>AI model</Label>
            <Select defaultValue="gpt-5.4-mini" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5.4-mini">GPT-5.4 Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
