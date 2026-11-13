"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { assetUrl } from "@/lib/utils";
import { FormFields, checkImage, type FieldDef, type FieldErrors, type Obj } from "./fields";

interface Props {
  items: Obj[];
  onChange: (items: Obj[]) => void;
  defs: FieldDef[];
  /** singular word, e.g. "event" */
  noun: string;
  newItem: () => Obj;
  title: (item: Obj) => string;
  subtitle?: (item: Obj) => React.ReactNode;
  /** photo link for the small picture in the list (optional) */
  thumb?: (item: Obj) => string;
  /** errors per item index (shown after a failed save) */
  errors?: Record<number, FieldErrors>;
  /** extra buttons above the list (e.g. "Sort by date") */
  toolbar?: React.ReactNode;
}

/** Add / edit / reorder / duplicate / delete a list of items. One item is open at a time. */
export default function ListEditor({ items, onChange, defs, noun, newItem, title, subtitle, thumb, errors = {}, toolbar }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const update = (i: number, next: Obj) => onChange(items.map((it, k) => (k === i ? next : it)));

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  }

  function duplicate(i: number) {
    const next = [...items];
    next.splice(i + 1, 0, JSON.parse(JSON.stringify(items[i])) as Obj);
    onChange(next);
    setOpen(i + 1);
  }

  function remove(i: number) {
    if (!window.confirm(`Delete this ${noun}? This is saved only when you press "Save changes".`)) return;
    onChange(items.filter((_, k) => k !== i));
    setOpen(null);
  }

  function add() {
    onChange([...items, newItem()]);
    setOpen(items.length);
  }

  const small = "btn btn-ghost !min-h-0 !px-3 !py-2 text-xs";

  return (
    <div className="space-y-3">
      {toolbar ? <div className="flex flex-wrap gap-2">{toolbar}</div> : null}

      {items.length === 0 ? <p className="card p-5 text-center text-sm text-muted">No {noun}s yet. Add the first one below.</p> : null}

      {items.map((item, i) => {
        const isOpen = open === i;
        const hasErr = !!errors[i] && Object.keys(errors[i]).length > 0;
        return (
          <div key={i} className="card overflow-hidden" style={hasErr ? { borderColor: "rgba(248,113,113,0.7)" } : undefined}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3 text-left">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-accent">
                {i + 1}
                {thumb && thumb(item) && !checkImage(thumb(item)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(thumb(item).trim())} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{title(item) || `New ${noun}`}</span>
                {subtitle ? <span className="block truncate text-xs text-muted">{subtitle(item)}</span> : null}
              </span>
              {hasErr ? <span className="shrink-0 rounded-full bg-red-400/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-red-300">Fix</span> : null}
              <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen ? (
              <div className="border-t border-[var(--border)] p-4">
                <FormFields defs={defs} value={item} onChange={(next) => update(i, next)} errors={errors[i]} />
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  <button type="button" className={small} onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp size={14} /> Move up</button>
                  <button type="button" className={small} onClick={() => move(i, 1)} disabled={i === items.length - 1}><ChevronDown size={14} /> Move down</button>
                  <button type="button" className={small} onClick={() => duplicate(i)}><Copy size={14} /> Duplicate</button>
                  <button type="button" className={`${small} !text-red-400`} onClick={() => remove(i)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <button type="button" onClick={add} className="btn btn-ghost w-full"><Plus size={18} /> Add {noun}</button>
    </div>
  );
}