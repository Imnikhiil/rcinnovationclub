"use client";

import { useId } from "react";
import { assetUrl } from "@/lib/utils";

export type Obj = Record<string, unknown>;
export type FieldErrors = Record<string, string>;
export type FieldType = "text" | "textarea" | "url" | "image" | "date" | "select" | "boolean";

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  maxLength?: number;
  /** two fields side by side on bigger screens */
  half?: boolean;
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

export function validateFields(defs: FieldDef[], value: Obj): FieldErrors {
  const errors: FieldErrors = {};
  for (const d of defs) {
    const raw = value[d.key];
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (d.required && (v === undefined || v === null || v === "")) {
      errors[d.key] = "Required";
      continue;
    }
    if (typeof v !== "string" || !v) continue;
    if (d.type === "url") {
      const e = checkLink(v);
      if (e) errors[d.key] = e;
    }
    if (d.type === "image") {
      const e = checkImage(v);
      if (e) errors[d.key] = e;
    }
    if (d.maxLength && v.length > d.maxLength) errors[d.key] = `Maximum ${d.maxLength} characters`;
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

/* ---------- rendering ---------- */

interface Props {
  defs: FieldDef[];
  value: Obj;
  onChange: (next: Obj) => void;
  errors?: FieldErrors;
}

export function FormFields({ defs, value, onChange, errors = {} }: Props) {
  const base = useId();
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {defs.map((d) => {
        const id = `${base}-${d.key}`;
        const raw = value[d.key];
        const str = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        const err = errors[d.key];
        const type = d.type ?? "text";

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
                {type === "textarea" ? (
                  <textarea id={id} rows={d.rows ?? 3} maxLength={d.maxLength ? d.maxLength + 200 : undefined} value={str} onChange={(e) => set(d.key, e.target.value)} placeholder={d.placeholder} className="field resize-y" aria-invalid={!!err} />
                ) : type === "select" ? (
                  <select id={id} value={str} onChange={(e) => set(d.key, e.target.value)} className="field" aria-invalid={!!err}>
                    {(d.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={type === "date" ? "date" : "text"}
                    inputMode={type === "url" || type === "image" ? "url" : undefined}
                    autoCapitalize="off"
                    value={str}
                    onChange={(e) => set(d.key, e.target.value)}
                    placeholder={d.placeholder}
                    className="field"
                    aria-invalid={!!err}
                  />
                )}
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