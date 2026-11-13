"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadImage } from "@/lib/admin-storage";

interface Props {
  folder: string;
  maxSide?: number;
  onUploaded: (url: string) => void;
}

/** "Upload photo" button: picks a file, shrinks it, uploads it, and hands back its link. */
export default function ImageUpload({ folder, maxSide, onUploaded }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so choosing the same file again still works
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onUploaded(await uploadImage(file, folder, maxSide));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={onPick} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs">
        <Upload size={14} /> {busy ? "Uploading…" : "Upload photo"}
      </button>
      {error ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-400">{error}</p> : null}
    </div>
  );
}