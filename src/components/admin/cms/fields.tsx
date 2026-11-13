"use client";

import { useId } from "react";
import { assetUrl, isEmail } from "@/lib/utils";
import ImageUpload from "./ImageUpload";

export type Obj = Record<string, unknown>;
export type FieldErrors = Record<string, string>;
export type FieldType = "text" | "textarea" | "url" | "image" | "date" | "select" | "boolean" | "email" | "lines" | "heading";

export interface FieldDef {
  /** may be a path like "profile.campus" for nested values */
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** select only: store the choice as a number (e.g. a 1-5 rating) */
  numeric?: boolean;
  rows?: number;
  maxLength?: number;
  /** two fields side by side on bigger screens */
  half?: boolean;
  /** image only: storage folder for uploads, e.g. "events" */
  folder?: string;
  /** image only: longest side in pixels after shrinking (default 1600) */
  maxSide?: number;
  /** text only: suggestions shown while typing */
  suggestions?: string[];
  /** show this field only when the function returns true (it is also skipped by validation) */
  showIf?: (value: Obj) => boolean;
}

/* ---------- nested values ("profile.campus") ---------- */

export function getPath(o: Obj, path: string): unknown {
  let cur: unknown = o;
  for (const k of path.split(".")) {
    if (cur && typeof cur === "object") cur = (cur as Obj)[k];
    else return undefined;
  }
  return cur;
}

export function setPath(o: Obj, path: string, v: unknown): Obj {
  const [head, ...rest] = path.split(".");
  if (!rest.length) return { ...o, [head]: v };
  const cur = o[head];
  const child: Obj = cur && typeof cur === "object" && !Array.isArray(cur) ? (cur as Obj) : {};
  return { ...o, [head]: setPath(child, rest.join("."), v) };
}

/* ---------- validation ---------- */

/** Only normal web links. Blocks things like javascript: that could run code when a visitor clicks. */
export function checkLink(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  return /^(https?:\/\/|mailto:|\/|#)/i.test(s) ? null : "Must start with https://, /, # or mailto:";
}

export function checkImage(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return null;
  if (/^[A-Za-z0-9_\-./%() ]+$/.test(s) && !s.includes("..") && !/^[a-z]+:/i.test(s)) return null;
  return "Use a full https:// link, or a path like assets/events/photo.webp";
}

export function checkEmail(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  return isEmail(s) || /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(s) ? null : "Enter a valid email address";
}

export function validateFields(defs: FieldDef[], value: Obj): FieldErrors {
  const errors: FieldErrors = {};
  for (const d of defs) {
    if (d.type === "heading") continue;
    if (d.showIf && !d.showIf(value)) continue;
    const raw = getPath(value, d.key);
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (d.required && (v === undefined || v === null || v === "")) {
      errors[d.key] = "Required";
      continue;
    }
    if (typeof v !== "string" || !v) continue;
    let e: string | null = null;
    if (d.type === "url") e = checkLink(v);
    if (d.type === "image") e = checkImage(v);
    if (d.type === "email") e = checkEmail(v);
    if (!e && d.maxLength && v.length > d.maxLength) e = `Maximum ${d.maxLength} characters`;
    if (e) errors[d.key] = e;
  }
  return errors;
}

/** For LIST items: trim text and drop empty optional values (a list is saved whole, so nothing falls back to a default). */
export function cleanObject(o: Obj, keepEmpty: string[] = []): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) {
    const val = typeof v === "string" ? v.trim() : v;
    if (val === "" || val === undefined || val === null) {
      if (keepEmpty.includes(k)) out[k] = "";
      continue;
    }
    out[k] = val;
  }
  return out;
}

/** Trim text values only. Use this for settings objects: empty text must stay "" so it overrides the built-in default. */
export function trimObject(o: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) out[k] = typeof v === "string" ? v.trim() : v;
  return out;
}

/** "one per line" list -> trimmed non-empty strings */
export function cleanLines(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}

/* ---------- rendering ---------- */

interface Props {
  defs: FieldDef[];
  value: Obj;
  onChange: (next: Obj) => void;
  errors?: FieldErrors;
}

export function FormFields({ defs, value, onChange, errors = {} }: Props) {
  const base = useId();
  const set = (key: string, v: unknown) => onChange(setPath(value, key, v));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {defs.map((d) => {
        const type = d.type ?? "text";
        if (d.showIf && !d.showIf(value)) return null;

        if (type === "heading") {
          return (
            <div key={d.key} className="mt-2 border-t border-[var(--border)] pt-4 sm:col-span-2">
              <h4 className="font-display text-base font-bold">{d.label}</h4>
              {d.help ? <p className="mt-1 text-xs text-muted">{d.help}</p> : null}
            </div>
          );
        }

        const id = `${base}-${d.key}`;
        const raw = getPath(value, d.key);
        const str = Array.isArray(raw) ? raw.join("\n") : typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        const err = errors[d.key];

        return (
          <div key={d.key} className={d.half ? "" : "sm:col-span-2"}>
            {type === "boolean" ? (
              <label htmlFor={id} className="flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold">
                <input id={id} type="checkbox" checked={raw === true} onChange={(e) => set(d.key, e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
                {d.label}
              </label>
            ) : (
              <>
                <label htmlFor={id} className="label">
                  {d.label} {d.required ? <span className="text-accent">*</span> : null}
                </label>
                {type === "textarea" || type === "lines" ? (
                  <textarea
                    id={id}
                    rows={d.rows ?? (type === "lines" ? 4 : 3)}
                    maxLength={d.maxLength ? d.maxLength + 200 : undefined}
                    value={str}
                    onChange={(e) => set(d.key, type === "lines" ? e.target.value.split("\n") : e.target.value)}
                    placeholder={d.placeholder}
                    className="field resize-y"
                    aria-invalid={!!err}
                  />
                ) : type === "select" ? (
                  <select
                    id={id}
                    value={str}
                    onChange={(e) => set(d.key, d.numeric && e.target.value !== "" ? Number(e.target.value) : e.target.value)}
                    className="field"
                    aria-invalid={!!err}
                  >
                    {(d.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={type === "date" ? "date" : "text"}
                    inputMode={type === "url" || type === "image" ? "url" : type === "email" ? "email" : undefined}
                    autoCapitalize="off"
                    value={str}
                    onChange={(e) => set(d.key, e.target.value)}
                    placeholder={d.placeholder}
                    className="field"
                    aria-invalid={!!err}
                    list={d.suggestions?.length ? `${id}-list` : undefined}
                  />
                )}
                {d.suggestions?.length ? (
                  <datalist id={`${id}-list`}>
                    {d.suggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                ) : null}
                {type === "image" ? (
                  <div className="mt-2">
                    <ImageUpload folder={d.folder ?? "uploads"} maxSide={d.maxSide} onUploaded={(url) => set(d.key, url)} />
                  </div>
                ) : null}
                {type === "image" && str && !checkImage(str) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={str} src={assetUrl(str.trim())} alt="" className="mt-2 hidden h-24 max-w-full rounded-lg border border-[var(--border)] object-cover" onLoad={(e) => (e.currentTarget.style.display = "block")} onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : null}
              </>
            )}
            {err ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-400">{err}</p> : null}
            {d.help ? <p className="mt-1.5 text-xs text-muted">{d.help}</p> : null}
          </div>
        );
      })}
    </div>
  );
}