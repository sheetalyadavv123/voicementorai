export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <span>
          Voice Mentor <span className="text-brand">AI</span>
        </span>
        <span>Built with Next.js, FastAPI, LangGraph, LiveKit, Deepgram, ElevenLabs &amp; OpenAI.</span>
      </div>
    </footer>
  );
}
