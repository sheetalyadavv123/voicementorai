export interface LiveKitTokenResponse {
  token: string;
  url: string;
  room_name: string;
}

export async function fetchLiveKitToken(): Promise<LiveKitTokenResponse> {
  const response = await fetch("/api/livekit/token", { method: "POST" });
  if (!response.ok) {
    throw new Error("Couldn't start a voice session — please try again.");
  }
  return response.json();
}
