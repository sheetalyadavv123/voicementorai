import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchDocuments, uploadDocument } from "@/services/documents-service";

const DOCUMENTS_KEY = ["documents"];

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: fetchDocuments,
    // Processing documents finish embedding in the background — poll while any are pending.
    refetchInterval: (query) =>
      query.state.data?.some((doc) => doc.status === "processing") ? 3000 : false,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success("Upload started — it'll be searchable in a moment.");
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
