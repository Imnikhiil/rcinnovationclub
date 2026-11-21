import { NextResponse } from "next/server";
import { getContent } from "@/lib/content";
import { validateContact, validateMembership, validateNewsletter } from "@/lib/form-rules";

/**
 * The only door through which visitors can send the Contact, Join and Newsletter forms.
 * It checks (in this order): same-site request, hidden trap field, filling speed, Cloudflare Turnstile (when configured),
 * per-IP limit, registration window (Join), every field, and only then writes to the database.
 *
 * Environment variables (Vercel -> Settings -> Environment Variables):
 *   SUPABASE_SERVICE_ROLE_KEY      secret, server only. Never put NEXT_PUBLIC_ in front of it.
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY    optional (Cloudflare Turnstile). Set both or neither.
 * Without the service key the route still works using the public key (current, less strict mode).
 */

export const dynamic = "force-dynamic";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TS_SECRET = process.env.TURNSTILE_SECRET_KEY;

type Kind = "contact" | "membership" | "newsletter";
const KINDS: Kind[] = ["contact", "membership", "newsletter"];

/** per visitor address, per 10 minutes. Generous, because a whole campus can share one public IP. */
const WINDOW_MS = 10 * 60 * 1000;
const PER_IP: Record<Kind, number> = { contact: 8, membership: 30, newsletter: 15 };
const MIN_FILL_MS = 2000; // humans need more than 2 seconds to fill a form
const hits = new Map<string, number[]>();

function tooMany(key: string, limit: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return false;
}

function reply(status: number, body: { ok: boolean; code?: string; message?: string }) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sameSite(req: Request): boolean {
  const host = req.headers.get("host");
  const from = req.headers.get("origin") || req.headers.get("referer");
  if (!host || !from) return false;
  try {
    return new URL(from).host === host;
  } catch {
    return false;
  }
}

async function turnstileOk(token: string, ip: string): Promise<boolean> {
  if (!token || !TS_SECRET) return false;
  try {
    const body = new URLSearchParams({ secret: TS_SECRET, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    return ((await r.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

const rid = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

async function insert(table: string, row: Record<string, unknown>): Promise<{ ok: true } | { ok: false; code: "duplicate" | "rate_limited" | "invalid" | "server" }> {
  if (!URL_ || !(SERVICE || ANON)) return { ok: false, code: "server" };
  const key = (SERVICE || ANON) as string;
  try {
    const res = await fetch(`${URL_}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    const b = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    if (res.status === 409 || b.code === "23505") return { ok: false, code: "duplicate" };
    if ((b.message || "").includes("rate_limited")) return { ok: false, code: "rate_limited" };
    if (b.code === "23514") return { ok: false, code: "invalid" };
    console.error(`[forms] insert into ${table} failed`, res.status, b.code, b.message);
    return { ok: false, code: "server" };
  } catch (e) {
    console.error(`[forms] insert into ${table} crashed`, e);
    return { ok: false, code: "server" };
  }
}

/** Is Join open today? Uses Indian time (the club is in Delhi) and one spare day on each side. */
async function joinClosedMessage(): Promise<string | null> {
  const c = await getContent();
  const r = c.registration;
  if (!r.enabled) return r.disabledMessage || "Membership registration is not available at the moment.";
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const day = (d: string, shift: number) => new Date(Date.parse(d + "T00:00:00Z") + shift * 86400000).toISOString().slice(0, 10);
  if (r.startDate && today < day(r.startDate, -1)) return (r.upcomingMessage || "Membership registration has not opened yet.").replace("{date}", r.startDate);
  if (r.endDate && today > day(r.endDate, 1)) return r.expiredMessage || r.closedMessage || "Membership registration has ended.";
  return null;
}

export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!KINDS.includes(kind as Kind)) return reply(404, { ok: false, code: "invalid", message: "Unknown form." });
  const k = kind as Kind;

  if (!sameSite(req)) return reply(403, { ok: false, code: "invalid", message: "Request not allowed." });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("bad body");
  } catch {
    return reply(400, { ok: false, code: "invalid", message: "Invalid request." });
  }

  // Bots that fill the hidden trap field, or send the form within 2 seconds, get a fake "success" and nothing is stored.
  const trap = typeof body.hp === "string" && body.hp.trim() !== "";
  const started = typeof body.t === "number" ? body.t : 0;
  if (trap || !started || Date.now() - started < MIN_FILL_MS) return reply(200, { ok: true });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

  if (TS_SECRET && !(await turnstileOk(typeof body.token === "string" ? body.token : "", ip))) {
    return reply(400, { ok: false, code: "captcha", message: "Verification failed. Please refresh the page and try again." });
  }

  if (tooMany(`${k}:${ip}`, PER_IP[k])) {
    return reply(429, { ok: false, code: "rate_limited", message: "Too many submissions from your network. Please try again in a few minutes." });
  }

  let result: Awaited<ReturnType<typeof insert>>;

  if (k === "contact") {
    const v = validateContact(body);
    if (!v.ok) return reply(400, { ok: false, code: "invalid", message: v.message });
    result = await insert("contact_messages", { id: rid("msg"), ...v.value, status: "unread" });
  } else if (k === "membership") {
    const closed = await joinClosedMessage();
    if (closed) return reply(403, { ok: false, code: "closed", message: closed });
    const v = validateMembership(body);
    if (!v.ok) return reply(400, { ok: false, code: "invalid", message: v.message });
    const { enrollment, ...rest } = v.value;
    result = await insert("applications", {
      id: rid("app"),
      name: rest.name,
      enrollment_number: enrollment,
      enrollment_number_lower: enrollment.toLowerCase(),
      course: rest.course,
      semester: rest.semester,
      email: rest.email,
      phone: rest.phone,
      skills: rest.skills,
      interests: rest.interests,
      reason: rest.reason,
      status: "pending",
    });
  } else {
    const v = validateNewsletter(body);
    if (!v.ok) return reply(400, { ok: false, code: "invalid", message: v.message });
    result = await insert("subscribers", { id: rid("sub"), email: v.value.email });
  }

  if (result.ok) return reply(200, { ok: true });
  if (result.code === "duplicate") return reply(409, { ok: false, code: "duplicate", message: "Already submitted." });
  if (result.code === "rate_limited") return reply(429, { ok: false, code: "rate_limited", message: "We are receiving a lot of submissions right now. Please try again in a few minutes." });
  if (result.code === "invalid") return reply(400, { ok: false, code: "invalid", message: "Some details are not allowed. Please check the form." });
  return reply(500, { ok: false, code: "server", message: "Something went wrong. Please try again later." });
}