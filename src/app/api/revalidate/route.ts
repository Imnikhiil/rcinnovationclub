import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Called by the admin panel right after a content change is saved.
 * Only a signed-in admin with the "super" or "content" role may trigger it:
 * we check the caller's Supabase token and their admin_profiles row (RLS lets a user read only their own row).
 * No secret key is needed.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!url || !key || !token) return NextResponse.json({ ok: false }, { status: 401 });

  const headers = { apikey: key, Authorization: `Bearer ${token}` };
  try {
    const who = await fetch(`${url}/auth/v1/user`, { headers, cache: "no-store" });
    if (!who.ok) return NextResponse.json({ ok: false }, { status: 401 });
    const user = (await who.json()) as { id?: string };
    if (!user.id) return NextResponse.json({ ok: false }, { status: 401 });

    const prof = await fetch(`${url}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, { headers, cache: "no-store" });
    const rows = prof.ok ? ((await prof.json()) as { role?: string }[]) : [];
    const role = rows[0]?.role;
    if (role !== "super" && role !== "content") return NextResponse.json({ ok: false }, { status: 403 });

    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}