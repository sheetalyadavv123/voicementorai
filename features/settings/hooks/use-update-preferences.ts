import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updatePreferences } from "@/services/preferences-service";

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => toast.success("Settings saved"),
    onError: (error: Error) => toast.error(error.message),
  });
}
