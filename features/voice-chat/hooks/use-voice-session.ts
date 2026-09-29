import { useMutation } from "@tanstack/react-query";
import { fetchLiveKitToken } from "@/services/voice-chat-service";

export function useVoiceSession() {
  return useMutation({
    mutationFn: fetchLiveKitToken,
  });
}
