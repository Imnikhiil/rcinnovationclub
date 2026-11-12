"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import defaults from "@/data/default-content.json";
import { mergeContent, type Content } from "@/lib/content";
import { loadCms, revalidateSite, saveCms, type CmsData, type CmsRow } from "@/lib/admin-cms";
import { useAdmin } from "../AdminShell";

export interface SaveOutcome {
  ok: boolean;
  message: string;
  conflict?: boolean;
}

interface Cms {
  status: "loading" | "ready" | "error";
  error: string;
  /** what is saved in the database (only the parts that were ever customised) */
  data: CmsData;
  /** what visitors see: built-in defaults + saved changes */
  effective: Content;
  updatedAt: string | null;
  updatedBy: string | null;
  saving: boolean;
  save: (key: string, value: unknown) => Promise<SaveOutcome>;
  /** forget the saved version of one section so the built-in default is used again */
  reset: (key: string) => Promise<SaveOutcome>;
  reload: () => Promise<void>;
}

const Ctx = createContext<Cms | null>(null);

export function useCms(): Cms {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCms must be used inside <CmsProvider>");
  return v;
}

export default function CmsProvider({ children }: { children: React.ReactNode }) {
  const me = useAdmin();
  const [status, setStatus] = useState<Cms["status"]>("loading");
  const [error, setError] = useState("");
  const [row, setRow] = useState<CmsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const rowRef = useRef<CmsRow | null>(null);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const r = await loadCms();
      rowRef.current = r;
      setRow(r);
      setError("");
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the website content.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const commit = useCallback(
    async (mutate: (d: CmsData) => void): Promise<SaveOutcome> => {
      if (busy.current) return { ok: false, message: "Another save is still running. Please wait a moment." };
      busy.current = true;
      setSaving(true);
      try {
        const prev = rowRef.current;
        const next: CmsData = { ...(prev?.data ?? {}) };
        mutate(next);
        const res = await saveCms(prev, next, me.email);
        if (!res.ok) return { ok: false, message: res.message, conflict: res.conflict };
        rowRef.current = res.row;
        setRow(res.row);
        const live = await revalidateSite();
        return {
          ok: true,
          message: live ? "Saved! The website has been updated." : "Saved! It will show on the website within about 10 minutes.",
        };
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [me.email],
  );

  const save = useCallback((key: string, value: unknown) => commit((d) => void (d[key] = value)), [commit]);
  const reset = useCallback((key: string) => commit((d) => void delete d[key]), [commit]);

  const data = row?.data;
  const value = useMemo<Cms>(
    () => ({
      status,
      error,
      data: data ?? {},
      effective: mergeContent(defaults, data ?? {}) as Content,
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ?? null,
      saving,
      save,
      reset,
      reload,
    }),
    [status, error, data, row?.updated_at, row?.updated_by, saving, save, reset, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}