"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, Download, ShieldCheck } from "lucide-react";
import { sbSelectOne } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { CertificateRow } from "@/lib/types";

interface Cfg {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  verifyLabel: string;
  verifyPlaceholder: string;
  verifyHint?: string;
  verifyButton: string;
  validMessage: string;
  invalidMessage: string;
  revokedMessage: string;
  issuerName: string;
  issuerTitle: string;
}

type Result = { kind: "valid" | "revoked"; cert: CertificateRow } | { kind: "invalid" } | { kind: "error" } | null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export default function CertificateVerify({ cfg }: { cfg: Cfg }) {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const autoRan = useRef(false);

  async function verify(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setResult(null);
    try {
      const cert = await sbSelectOne<CertificateRow>("certificates", "id", value);
      if (!cert) setResult({ kind: "invalid" });
      else setResult({ kind: cert.status === "revoked" ? "revoked" : "valid", cert });
    } catch {
      setResult({ kind: "error" });
    }
    setBusy(false);
  }

  // Support links like /resources?cert=RCIC-2026-DEMO01
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const q = new URLSearchParams(window.location.search).get("cert");
    if (q) {
      setId(q);
      void verify(q);
    }
  }, []);

  function download(c: CertificateRow) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><title>Certificate ${esc(c.id)}</title>
<style>body{font-family:Georgia,serif;text-align:center;padding:60px;border:10px double #0e7490;margin:20px}
h1{font-size:40px;margin:10px 0}h2{font-size:34px;margin:30px 0;color:#0e7490}p{font-size:18px;color:#333}small{color:#666}</style>
<p>${esc(cfg.issuerName)} · ${esc(cfg.issuerTitle)}</p>
<h1>Certificate of ${esc(c.type)}</h1><p>This is proudly presented to</p><h2>${esc(c.recipient_name)}</h2>
<p>${esc(c.event_title)}</p>${c.description ? `<p>${esc(c.description)}</p>` : ""}
<p>Issued on ${esc(formatDate(c.issue_date))}</p><small>Certificate ID: ${esc(c.id)}</small>
<script>window.onload=function(){window.print()}<\/script>`);
    w.document.close();
  }

  return (
    <div className="card mx-auto max-w-2xl p-7 sm:p-9">
      <div className="text-center">
        {cfg.eyebrow ? <span className="eyebrow">{cfg.eyebrow}</span> : null}
        <h2 className="mt-3 font-display text-2xl font-bold">{cfg.title}</h2>
        {cfg.subtitle ? <p className="mt-2 text-sm text-muted">{cfg.subtitle}</p> : null}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void verify(id); }} className="mt-6">
        <label htmlFor="cert-id" className="label">{cfg.verifyLabel}</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="cert-id" value={id} onChange={(e) => setId(e.target.value)} placeholder={cfg.verifyPlaceholder} className="field flex-1 uppercase" autoComplete="off" />
          <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-60">
            <ShieldCheck size={17} /> {busy ? "Checking…" : cfg.verifyButton}
          </button>
        </div>
        {cfg.verifyHint ? <p className="mt-2 text-xs text-muted">{cfg.verifyHint}</p> : null}
      </form>

      <div aria-live="polite" className="mt-5">
        {result?.kind === "invalid" ? (
          <p className="msg-error flex items-center gap-2"><CircleX size={18} /> {cfg.invalidMessage}</p>
        ) : null}
        {result?.kind === "error" ? (
          <p className="msg-error">Could not check the certificate right now. Please try again later.</p>
        ) : null}
        {result && (result.kind === "valid" || result.kind === "revoked") ? (
          <div className={result.kind === "valid" ? "msg-success" : "msg-error"}>
            <p className="flex items-center gap-2">
              {result.kind === "valid" ? <CircleCheck size={18} /> : <CircleX size={18} />}
              {result.kind === "valid" ? cfg.validMessage : cfg.revokedMessage}
            </p>
            <dl className="mt-3 grid gap-1 text-sm font-normal text-[var(--fg)]">
              <div><dt className="inline font-bold">Name: </dt><dd className="inline">{result.cert.recipient_name}</dd></div>
              <div><dt className="inline font-bold">Type: </dt><dd className="inline capitalize">{result.cert.type}</dd></div>
              <div><dt className="inline font-bold">Event: </dt><dd className="inline">{result.cert.event_title}</dd></div>
              <div><dt className="inline font-bold">Issued: </dt><dd className="inline">{formatDate(result.cert.issue_date)}</dd></div>
              <div><dt className="inline font-bold">ID: </dt><dd className="inline">{result.cert.id}</dd></div>
            </dl>
            {result.kind === "valid" ? (
              <button type="button" onClick={() => download(result.cert)} className="btn btn-ghost mt-4 !py-2 text-sm">
                <Download size={15} /> Download Certificate
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}