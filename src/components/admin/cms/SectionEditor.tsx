"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, RotateCcw, Save, Undo2 } from "lucide-react";
import { useCms } from "./CmsProvider";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v ?? null)) as T;

interface Validation<E> {
  errors: E;
  /** number of problems; 0 = fine to save */
  count: number;
}

interface Props<T, E> {
  /** key inside cms_content.data, e.g. "events" */
  sectionKey: string;
  title: string;
  intro?: string;
  /** public page that shows this section */
  viewHref?: string;
  /** what visitors currently see for this section */
  initial: T;
  validate: (draft: T) => Validation<E>;
  /** tidy the draft just before saving; receives what was loaded so it can detect changes */
  normalize?: (draft: T, initial: T) => T;
  /** extra content shown above the form (e.g. a live preview) */
  aside?: (draft: T) => React.ReactNode;
  children: (ctx: { draft: T; setDraft: (v: T) => void; errors: E | undefined }) => React.ReactNode;
}

/** Draft + Save / Discard / Reset bar for one section of the website. Nothing changes on the site until Save. */
export default function SectionEditor<T, E>({ sectionKey, title, intro, viewHref, initial, validate, normalize, aside, children }: Props<T, E>) {
  const cms = useCms();
  const initialJson = useMemo(() => JSON.stringify(initial ?? null), [initial]);
  const [draft, setDraft] = useState<T>(() => clone(initial));
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  // when the saved version changes (after Save / Reset / Reload) start a fresh draft from it
  useEffect(() => {
    setDraft(JSON.parse(initialJson) as T);
    setAttempted(false);
  }, [initialJson]);

  const dirty = JSON.stringify(draft ?? null) !== initialJson;
  const check = validate(draft);
  const customised = sectionKey in cms.data;

  // warn before closing the tab with unsaved work
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function change(v: T) {
    setDraft(v);
    setNotice("");
    setError("");
  }

  async function onSave() {
    setNotice("");
    setError("");
    setConflict(false);
    setAttempted(true);
    if (check.count > 0) {
      setError(`Please fix ${check.count} problem${check.count > 1 ? "s" : ""} (marked in red) and save again.`);
      return;
    }
    const value = normalize ? normalize(draft, clone(initial)) : draft;
    const res = await cms.save(sectionKey, value);
    if (res.ok) setNotice(res.message);
    else {
      setError(res.message);
      setConflict(!!res.conflict);
    }
  }

  async function onReset() {
    if (!window.confirm("Go back to the built-in default for this section? Your saved changes for it will be removed.")) return;
    setNotice("");
    setError("");
    const res = await cms.reset(sectionKey);
    if (res.ok) setNotice(res.message);
    else setError(res.message);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
          {intro ? <p className="mt-1 text-sm text-muted">{intro}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${customised ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-400/20 text-slate-300"}`}>
            {customised ? "Customised" : "Built-in default"}
          </span>
          {viewHref ? (
            <a href={viewHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><ExternalLink size={14} /> View page</a>
          ) : null}
        </div>
      </div>

      {aside ? aside(draft) : null}

      {children({ draft, setDraft: change, errors: attempted ? check.errors : undefined })}

      {error ? (
        <div role="alert" className="msg-error">
          {error}
          {conflict ? (
            <button type="button" onClick={() => void cms.reload()} className="btn btn-ghost mt-3 !min-h-0 !px-3 !py-2 text-xs"><RefreshCw size={14} /> Reload latest content</button>
          ) : null}
        </div>
      ) : null}
      {notice ? <p role="status" className="msg-success">{notice}</p> : null}

      <div className="sticky bottom-0 z-20 -mx-5 flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <button type="button" onClick={() => void onSave()} disabled={!dirty || cms.saving} className="btn btn-primary flex-1 disabled:opacity-50 sm:flex-none">
          <Save size={17} /> {cms.saving ? "Saving…" : "Save changes"}
        </button>
        {dirty ? (
          <button type="button" onClick={() => { setDraft(clone(initial)); setAttempted(false); setError(""); setNotice(""); }} className="btn btn-ghost">
            <Undo2 size={17} /> Discard
          </button>
        ) : null}
        {customised ? (
          <button type="button" onClick={() => void onReset()} disabled={cms.saving} className="btn btn-ghost sm:ml-auto">
            <RotateCcw size={17} /> Reset to default
          </button>
        ) : null}
        {dirty ? <span className="w-full text-xs font-semibold text-amber-300 sm:w-auto">Unsaved changes</span> : null}
      </div>
    </section>
  );
}