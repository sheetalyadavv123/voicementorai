"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments, useUploadDocument } from "@/features/notes/hooks/use-documents";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  processing: <Loader2 className="h-4 w-4 animate-spin text-amber-500" />,
  ready: <FileText className="h-4 w-4 text-emerald-500" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
} as const;

// The upload request is proxied through a Next.js route (app/api/documents/upload),
// which on Vercel is a serverless function capped at a hard, non-configurable 4.5MB
// request body — anything larger fails with an opaque 413 before our code even runs.
// Checked client-side so the user gets a clear message instead of that.
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export function NotesPanel() {
  const { data: documents, isLoading } = useDocuments();
  const { mutate: upload, isPending } = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error("That PDF is too large — please upload one under 4.5MB.");
      } else {
        upload(file);
      }
    }
    event.target.value = "";
  }

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Your notes</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {isPending ? "Uploading…" : "Upload PDF"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && documents?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No notes uploaded yet — add a PDF and your mentor can answer from it, with citations.
          </p>
        )}
        {documents?.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              {STATUS_ICON[doc.status]}
              <span className="truncate">{doc.filename}</span>
            </div>
            <span
              title={doc.status === "failed" ? (doc.error_message ?? undefined) : undefined}
              className={cn(
                "ml-3 max-w-[45%] shrink-0 truncate text-xs text-muted-foreground",
                doc.status !== "failed" && "capitalize",
                doc.status === "failed" && "text-destructive"
              )}
            >
              {doc.status === "failed" ? (doc.error_message ?? "failed") : doc.status}
            </span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
