"use client";

import "@livekit/components-styles";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import type { MediaDeviceFailure } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { useVoiceSession } from "@/features/voice-chat/hooks/use-voice-session";
import { VoiceChatPanel } from "@/features/voice-chat/components/voice-chat-panel";

interface VoiceChatRoomProps {
  studentName: string;
}

export function VoiceChatRoom({ studentName }: VoiceChatRoomProps) {
  const [connection, setConnection] = useState<{ token: string; url: string } | null>(null);
  const { mutate: startSession, isPending } = useVoiceSession();

  const handleStart = useCallback(() => {
    startSession(undefined, {
      onSuccess: (data) => setConnection({ token: data.token, url: data.url }),
      onError: (error) => toast.error(error.message),
    });
  }, [startSession]);

  const handleDisconnect = useCallback(() => {
    setConnection(null);
  }, []);

  const handleMediaDeviceFailure = useCallback((failure?: MediaDeviceFailure) => {
    toast.error(
      failure === "PermissionDenied"
        ? "Microphone access was denied — allow microphone permissions and try again."
        : "Couldn't access your microphone. Check your device settings and try again."
    );
    setConnection(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    toast.error(`Connection lost: ${error.message}`);
    setConnection(null);
  }, []);

  if (!connection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-24 w-24 items-center justify-center rounded-full border border-border/60 bg-card/70 backdrop-blur"
        >
          <Mic className="h-9 w-9 text-muted-foreground" />
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Ready when you are, {studentName}</h2>
          <p className="text-sm text-muted-foreground">
            Start a conversation with your AI mentor — ask a question, request a topic, or say
            &quot;quiz me on...&quot;
          </p>
        </div>
        <Button size="lg" onClick={handleStart} disabled={isPending} className="rounded-full px-8">
          {isPending ? "Connecting…" : "Start conversation"}
        </Button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connection.url}
      token={connection.token}
      audio
      connect
      onDisconnected={handleDisconnect}
      onMediaDeviceFailure={handleMediaDeviceFailure}
      onError={handleError}
      className="h-full"
    >
      <RoomAudioRenderer />
      <VoiceChatPanel onDisconnect={handleDisconnect} />
    </LiveKitRoom>
  );
}
