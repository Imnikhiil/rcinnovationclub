import defaults from "@/data/default-content.json";

export type Content = typeof defaults;

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Objects merge deeply; arrays and values from the database win over defaults. */
function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (isObject(base) && isObject(over)) {
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(over)) {
      out[key] = key in base ? merge((base as Record<string, unknown>)[key], over[key]) : over[key];
    }
    return out as T;
  }
  return (over === undefined || over === null ? base : over) as T;
}

/**
 * Reads the website content from Supabase (table cms_content, row "main")
 * and falls back to the built-in defaults.
 *
 * IMPORTANT for the free tier: the response is cached by Next.js for 10 minutes
 * and shared by ALL visitors, so Supabase is hit about once per 10 minutes,
 * not once per visitor.
 */
export async function getContent(): Promise<Content> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return defaults;

  try {
    const res = await fetch(`${url}/rest/v1/cms_content?id=eq.main&select=data`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 600, tags: ["cms"] },
    });
    if (!res.ok) return defaults;
    const rows = (await res.json()) as { data?: unknown }[];
    return merge(defaults, rows?.[0]?.data ?? {});
  } catch {
    return defaults;
  }
}