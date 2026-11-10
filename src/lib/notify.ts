import type { NotifyConfig } from "@/lib/types";

/** Best-effort email alert through Web3Forms. Never blocks or fails the visitor's submission. */
export async function sendNotification(cfg: NotifyConfig | undefined, subject: string, body: string, replyTo?: string, replyName?: string) {
  if (!cfg || !cfg.enabled || !cfg.accessKey) return;
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: cfg.accessKey,
        subject,
        name: replyName || "RC Innovation Club Website",
        email: replyTo || cfg.notifyEmail || "noreply@example.com",
        message: body,
        from_name: "RC Innovation Club Website",
      }),
    });
  } catch {
    /* alert failed: the submission itself is already saved */
  }
}

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}