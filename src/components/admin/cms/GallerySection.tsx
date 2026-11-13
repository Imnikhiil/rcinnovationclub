"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useCms } from "./CmsProvider";
import SectionEditor from "./SectionEditor";
import ListEditor from "./ListEditor";
import { validateList } from "./ListSection";
import { cleanObject, type FieldDef, type FieldErrors, type Obj } from "./fields";
import { uploadImage } from "@/lib/admin-storage";
import { formatDate, slugify } from "@/lib/utils";

const BASE_CATEGORIES = ["Workshop", "Competition", "Seminar", "Robotics", "Club Activity"];
const isVideo = (v: Obj) => v.type === "video";

function buildDefs(categories: string[]): FieldDef[] {
  return [
    { key: "title", label: "Title", required: true, maxLength: 100 },
    { key: "category", label: "Category", half: true, maxLength: 30, suggestions: categories, help: "Visitors can filter the gallery by category. Pick one or type a new one." },
    { key: "eventDate", label: "Date", type: "date", half: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      half: true,
      options: [
        { value: "image", label: "Photo" },
        { value: "video", label: "Video" },
      ],
    },
    { key: "src", label: "Photo", type: "image", folder: "gallery", maxSide: 1600, required: true, showIf: (v) => !isVideo(v), help: "Upload a photo, or paste a link." },
    { key: "mediaUrl", label: "Video file link (.mp4)", type: "url", required: true, showIf: isVideo, help: "A direct link to an .mp4 file. YouTube links do not work here." },
    { key: "thumbnailUrl", label: "Video cover photo", type: "image", folder: "gallery", maxSide: 1200, showIf: isVideo, help: "Shown in the grid before the video is opened." },
    { key: "description", label: "Description", type: "textarea", rows: 3, maxLength: 400 },
  ];
}

const nameToTitle = (file: string) =>
  file
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Photo";

function normalizeItem(it: Obj, index: number): Obj {
  const o = cleanObject(it);
  if (isVideo(o)) {
    o.type = "video";
    delete o.src;
  } else {
    o.type = "image";
    delete o.mediaUrl;
    delete o.thumbnailUrl;
  }
  o.id = o.id || `gal_${slugify(String(o.title ?? "")).slice(0, 30) || "item"}_${Math.random().toString(36).slice(2, 6)}`;
  o.uploadedAt = o.uploadedAt || new Date().toISOString();
  o.order = index; // the website shows items in this order, so the list order here is the order there
  return o;
}

export function GalleryEditor() {
  const cms = useCms();
  const initial = (cms.effective.gallery as unknown as Obj[]) ?? [];
  const defs = useMemo(() => {
    const found = initial.map((g) => String(g.category ?? "").trim()).filter(Boolean);
    return buildDefs(Array.from(new Set([...BASE_CATEGORIES, ...found])));
  }, [initial]);

  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const uploading = progress !== "";

  async function bulkUpload(files: File[], draft: Obj[], setDraft: (v: Obj[]) => void) {
    const list = files.slice(0, 20);
    const added: Obj[] = [];
    const failed: string[] = [];
    setProblems(files.length > 20 ? ["Only the first 20 photos were used. Upload the rest in another batch."] : []);
    for (let i = 0; i < list.length; i++) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const url = await uploadImage(list[i], "gallery", 1600);
        added.push({ type: "image", title: nameToTitle(list[i].name), category: "", eventDate: "", description: "", src: url });
      } catch (e) {
        failed.push(`${list[i].name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setProgress("");
    if (added.length) setDraft([...added, ...draft]); // newest first
    setProblems((p) => [...p, ...failed]);
  }

  return (
    <SectionEditor<Obj[], Record<number, FieldErrors>>
      sectionKey="gallery"
      title="Gallery"
      intro="Photos and videos on the Gallery page (the first six also appear on the home page). The order here is the order on the website."
      viewHref="/gallery"
      initial={initial}
      validate={(d) => validateList(d, defs)}
      normalize={(d) => d.map((it, i) => normalizeItem(it, i))}
    >
      {({ draft, setDraft, errors }) => (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const files: File[] = Array.from((e.target.files ?? []) as ArrayLike<File>);
                e.target.value = "";
                if (files.length) void bulkUpload(files, draft, setDraft);
              }}
            />
            <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="btn btn-primary">
              <ImagePlus size={18} /> {uploading ? progress : "Upload photos"}
            </button>
            <p className="min-w-0 flex-1 text-xs text-muted">Pick up to 20 photos at once. They are shrunk automatically, added at the top, and the website changes only after you press Save changes.</p>
          </div>

          {problems.length ? (
            <div role="alert" className="msg-error space-y-1">
              {problems.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : null}

          <div className={uploading ? "pointer-events-none opacity-60" : ""} aria-busy={uploading}>
            <ListEditor
              items={draft}
              onChange={setDraft}
              defs={defs}
              noun="item"
              errors={errors}
              newItem={() => ({ type: "image", title: "", category: "", eventDate: "", description: "", src: "" })}
              title={(g) => String(g.title ?? "")}
              thumb={(g) => String(isVideo(g) ? g.thumbnailUrl ?? "" : g.src ?? "")}
              subtitle={(g) => [isVideo(g) ? "Video" : "", g.category, formatDate(String(g.eventDate ?? ""))].filter(Boolean).join(" · ")}
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}