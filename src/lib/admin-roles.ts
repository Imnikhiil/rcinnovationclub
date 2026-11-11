export type AdminRole = "super" | "content" | "membership";

export const ROLE_LABEL: Record<AdminRole, string> = {
  super: "Super Admin",
  content: "Content Editor",
  membership: "Membership Manager",
};

export interface AdminSection {
  key: string;
  label: string;
  href: string;
  roles: AdminRole[];
  /** false = page not built yet (shown as "Soon") */
  ready: boolean;
  hint: string;
}

/** Same role rules as the old admin (and the same Supabase RLS policies enforce them on the server). */
export const SECTIONS: AdminSection[] = [
  { key: "applications", label: "Applications", href: "/admin/applications", roles: ["super", "membership"], ready: true, hint: "Review membership applications" },
  { key: "messages", label: "Messages", href: "/admin/messages", roles: ["super", "membership"], ready: true, hint: "Read contact form messages" },
  { key: "content", label: "Website content", href: "/admin/content", roles: ["super", "content"], ready: false, hint: "Edit events, team, gallery, FAQ and more" },
  { key: "subscribers", label: "Subscribers", href: "/admin/subscribers", roles: ["super", "membership"], ready: false, hint: "Newsletter email list" },
  { key: "certificates", label: "Certificates", href: "/admin/certificates", roles: ["super", "membership"], ready: false, hint: "Issue or revoke certificates" },
];

export const isAdminRole = (v: unknown): v is AdminRole => v === "super" || v === "content" || v === "membership";
export const sectionsFor = (role: AdminRole) => SECTIONS.filter((s) => s.roles.includes(role));