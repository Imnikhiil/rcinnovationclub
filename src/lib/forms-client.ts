/** Browser side of the public forms: sends one form to /api/forms/<kind>. */

export type FormKind = "contact" | "membership" | "newsletter";
export type FormCode = "invalid" | "duplicate" | "rate_limited" | "captcha" | "closed" | "server" | "network";
export type FormResult = { ok: true } | { ok: false; code: FormCode; message: string };

export interface GuardExtras {
  /** the hidden trap field: must stay empty */
  hp: string;
  /** when the visitor started the form (ms) */
  t: number;
  /** Cloudflare Turnstile answer, when it is switched on */
  token: string;
}

export async function submitForm(kind: FormKind, data: Record<string, unknown>, guard: GuardExtras): Promise<FormResult> {
  try {
    const res = await fetch(`/api/forms/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, ...guard }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: FormCode; message?: string };
    if (res.ok && body.ok) return { ok: true };
    return { ok: false, code: body.code ?? "server", message: body.message || "Something went wrong. Please try again later." };
  } catch {
    return { ok: false, code: "network", message: "Network error. Please check your internet connection and try again." };
  }
}