"use client";

import type { AdminRole } from "@/lib/admin-roles";
import { useAdmin } from "./AdminShell";

/** Hides a page from roles that must not see it. (Real protection is Supabase RLS; this is just a clear message.) */
export default function RoleGate({ roles, children }: { roles: AdminRole[]; children: React.ReactNode }) {
  const me = useAdmin();
  if (!roles.includes(me.role)) {
    return (
      <div className="card mx-auto max-w-md p-7 text-center">
        <h1 className="font-display text-xl font-bold">Not available for your role</h1>
        <p className="mt-2 text-sm text-muted">This section is only for Super Admin and Membership Manager accounts.</p>
      </div>
    );
  }
  return <>{children}</>;
}