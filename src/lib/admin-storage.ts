/**
 * Photo upload to the public Supabase Storage bucket "gallery".
 * Photos are shrunk and converted to WebP in the browser first, so a 6 MB phone photo becomes ~200 KB.
 * Only super / content admins may upload: Storage policies (supabase/storage-setup.sql) enforce it.
 */
import { getSession } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET = "gallery";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024; // the bucket limit is 5 MB

export async function prepareImage(file: File, maxSide: number): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  if (!ALLOWED.includes(file.type)) throw new Error("Please choose a JPG, PNG or WebP image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("This photo is over 25 MB. Please choose a smaller one.");

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bmp = await createImageBitmap(file);
    } catch {
      throw new Error("This image could not be read. Try another photo.");
    }
  }

  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot process images.");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();

  const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((res) => c.toBlob(res, type, q));
  let blob = await toBlob(canvas, "image/webp", 0.82);
  let ext: "webp" | "jpg" = "webp";
  if (!blob || blob.type !== "image/webp") {
    // This browser cannot save WebP: use JPEG on a white background (JPEG has no transparency).
    const flat = document.createElement("canvas");
    flat.width = w;
    flat.height = h;
    const fctx = flat.getContext("2d");
    if (!fctx) throw new Error("Your browser cannot process images.");
    fctx.fillStyle = "#ffffff";
    fctx.fillRect(0, 0, w, h);
    fctx.drawImage(canvas, 0, 0);
    blob = await toBlob(flat, "image/jpeg", 0.85);
    ext = "jpg";
  }
  if (!blob) throw new Error("Could not process this image.");
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("The photo is still too large after compressing. Choose a smaller one.");
  return { blob, ext };
}

function friendlyError(status: number, body: { message?: string; error?: string }): string {
  const msg = `${body.message || ""} ${body.error || ""}`.toLowerCase();
  if (status === 401) return "Session expired. Please sign in again.";
  if (msg.includes("bucket not found") || status === 404) return 'The storage bucket "gallery" does not exist yet. Run supabase/storage-setup.sql in Supabase.';
  if (msg.includes("row-level security") || msg.includes("policy") || status === 403) return "Upload not allowed. Run supabase/storage-setup.sql in Supabase, and make sure your role is Super Admin or Content Editor.";
  if (status === 413 || msg.includes("too large") || msg.includes("exceeded")) return "The file is too large.";
  if (msg.includes("mime")) return "This file type is not allowed. Use JPG, PNG or WebP.";
  return body.message || `Upload failed (${status}).`;
}

/** Compresses and uploads one photo. Returns its public https:// link. */
export async function uploadImage(file: File, folder: string, maxSide = 1600): Promise<string> {
  if (!URL_ || !KEY) throw new Error("The backend is not configured.");
  const session = await getSession();
  if (!session) throw new Error("Session expired. Please sign in again.");

  const { blob, ext } = await prepareImage(file, maxSide);
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "uploads";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "photo";
  const path = `${safeFolder}/${new Date().toISOString().slice(0, 7)}/${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`;

  // Same request shape the official supabase-js client sends for a Blob (multipart form, empty field name).
  const form = new FormData();
  form.append("cacheControl", "31536000"); // file names are unique, so browsers can keep them for a year
  form.append("", blob);

  let res: Response;
  try {
    res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${session.access_token}`, "x-upsert": "false" },
      body: form,
    });
  } catch {
    throw new Error("Network error while uploading. Check your internet connection.");
  }
  if (!res.ok) throw new Error(friendlyError(res.status, (await res.json().catch(() => ({}))) as { message?: string; error?: string }));
  return `${URL_}/storage/v1/object/public/${BUCKET}/${path}`;
}