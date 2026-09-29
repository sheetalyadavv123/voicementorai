import type { DocumentOut } from "@/app/api/documents/route";

export type { DocumentOut };

export async function fetchDocuments(): Promise<DocumentOut[]> {
  const response = await fetch("/api/documents");
  if (!response.ok) throw new Error("Failed to load your notes");
  return response.json();
}

export async function uploadDocument(file: File): Promise<DocumentOut> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed");
  }
  return response.json();
}
