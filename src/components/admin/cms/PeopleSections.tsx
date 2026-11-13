"use client";

import ListSection from "./ListSection";
import { cleanLines, cleanObject, type FieldDef, type Obj } from "./fields";

const IMG_HELP = "Upload a photo, or paste a link (https://…) or a site path like assets/team/name.webp.";

/* ============================================================================
   CORE TEAM  (with the optional profile popup)
   ============================================================================ */

const TEAM_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 60 },
  { key: "role", label: "Role", required: true, half: true, placeholder: "e.g. Event Head", maxLength: 60 },
  { key: "img", label: "Photo", type: "image", folder: "team", maxSide: 800, help: IMG_HELP },
  {
    key: "accent",
    label: "Colour ring",
    type: "select",
    half: true,
    options: [
      { value: "sky", label: "Cyan" },
      { value: "violet", label: "Violet" },
    ],
  },
  {
    key: "department",
    label: "Department filter",
    type: "select",
    half: true,
    options: [
      { value: "", label: "Automatic (from the role)" },
      { value: "leadership", label: "Leadership" },
      { value: "events", label: "Events" },
      { value: "media", label: "Media" },
      { value: "technical", label: "Technical" },
      { value: "finance", label: "Finance" },
      { value: "operations", label: "Operations" },
    ],
  },
  { key: "lead", label: "Show the “Lead” badge on the card", type: "boolean" },

  { key: "_profile", label: "Profile popup (optional)", type: "heading", help: "If you fill any of these, tapping the member opens a profile. Leave all empty for no popup." },
  { key: "profile.campus", label: "Campus / college", half: true, maxLength: 80 },
  { key: "profile.tagline", label: "Tagline", half: true, maxLength: 120 },
  { key: "profile.introduction", label: "Introduction", type: "textarea", rows: 4, maxLength: 800 },
  { key: "profile.responsibilities", label: "Responsibilities", type: "lines", rows: 4, help: "One per line." },
  { key: "profile.skills", label: "Skills", type: "lines", rows: 3, help: "One per line." },

  { key: "_links", label: "Profile links (optional)", type: "heading" },
  { key: "profile.links.linkedin", label: "LinkedIn", type: "url", half: true, placeholder: "https://linkedin.com/in/…" },
  { key: "profile.links.github", label: "GitHub", type: "url", half: true, placeholder: "https://github.com/…" },
  { key: "profile.links.instagram", label: "Instagram", type: "url", half: true, placeholder: "https://instagram.com/…" },
  { key: "profile.links.portfolio", label: "Portfolio / website", type: "url", half: true, placeholder: "https://…" },
  { key: "profile.links.whatsapp", label: "WhatsApp", type: "url", half: true, placeholder: "https://wa.me/…" },
  { key: "profile.links.email", label: "Email", type: "email", half: true, placeholder: "name@example.com" },
];

function normalizeMember(it: Obj): Obj {
  const out = cleanObject(it);
  const p = out.profile;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const pr = cleanObject(p as Obj);
    for (const k of ["responsibilities", "skills"]) {
      const lines = cleanLines(pr[k]);
      if (lines.length) pr[k] = lines;
      else delete pr[k];
    }
    if (pr.links && typeof pr.links === "object") {
      const links = cleanObject(pr.links as Obj);
      if (Object.keys(links).length) pr.links = links;
      else delete pr.links;
    }
    if (Object.keys(pr).length) out.profile = pr;
    else delete out.profile; // no profile data = card is not clickable
  }
  return out;
}

export function TeamEditor() {
  return (
    <ListSection
      sectionKey="coreTeam"
      title="Core team"
      intro="The team cards on the Team page. Drag order = the order on the page (use Move up / Move down)."
      viewHref="/team"
      noun="member"
      defs={TEAM_DEFS}
      newItem={() => ({ name: "", role: "", img: "", accent: "sky", lead: false, department: "" })}
      titleOf={(m) => String(m.name ?? "")}
      thumbOf={(m) => String(m.img ?? "")}
      subtitleOf={(m) => {
        const dept = String(m.department ?? "");
        return `${m.role ?? ""}${m.lead ? " · Lead" : ""}${dept ? ` · ${dept}` : ""}${m.profile ? " · has profile" : ""}`;
      }}
      normalizeItem={normalizeMember}
    />
  );
}

/* ============================================================================
   AMBASSADORS
   ============================================================================ */

const AMB_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 60 },
  { key: "label", label: "Title", half: true, placeholder: "Ambassador", maxLength: 40, help: "For example Ambassador or Previous Ambassador." },
  { key: "period", label: "Period", half: true, placeholder: "2025–26", maxLength: 40 },
  { key: "image", label: "Photo", type: "image", folder: "team", maxSide: 800, help: IMG_HELP },
  { key: "description", label: "About", type: "textarea", rows: 3, maxLength: 500 },
];

export function AmbassadorsEditor() {
  return (
    <ListSection
      sectionKey="ambassadors"
      title="Ambassadors"
      viewHref="/team#ambassadors"
      noun="ambassador"
      defs={AMB_DEFS}
      newItem={() => ({ name: "", label: "Ambassador", period: "", description: "", image: "" })}
      titleOf={(a) => String(a.name ?? "")}
      thumbOf={(a) => String(a.image ?? "")}
      subtitleOf={(a) => `${a.label ?? ""}${a.period ? ` · ${a.period}` : ""}`}
    />
  );
}

/* ============================================================================
   MEMBERS (current and previous)
   ============================================================================ */

const MEMBER_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 60 },
  { key: "role", label: "Role (optional)", half: true, maxLength: 60 },
];

export function MembersEditor() {
  return (
    <ListSection
      sectionKey="membersCurrent"
      title="Members"
      intro="Current members listed on the Team page."
      viewHref="/team#members"
      noun="member"
      defs={MEMBER_DEFS}
      newItem={() => ({ name: "", role: "" })}
      titleOf={(m) => String(m.name ?? "")}
      subtitleOf={(m) => String(m.role ?? "")}
    />
  );
}

export function PreviousMembersEditor() {
  return (
    <ListSection
      sectionKey="membersPrevious"
      title="Previous members"
      intro="Alumni listed on the Team page."
      viewHref="/team#members"
      noun="member"
      defs={MEMBER_DEFS}
      newItem={() => ({ name: "", role: "" })}
      titleOf={(m) => String(m.name ?? "")}
      subtitleOf={(m) => String(m.role ?? "")}
    />
  );
}

/* ============================================================================
   FACULTY
   ============================================================================ */

const FACULTY_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 60 },
  { key: "designation", label: "Designation", half: true, placeholder: "Assistant Professor", maxLength: 80 },
  { key: "role", label: "Role in the club", half: true, placeholder: "Faculty Coordinator", maxLength: 80 },
  { key: "period", label: "Period", half: true, placeholder: "2024–present", maxLength: 40 },
  { key: "image", label: "Photo", type: "image", folder: "team", maxSide: 800, help: IMG_HELP },
  { key: "description", label: "About", type: "textarea", rows: 3, maxLength: 500 },
];

export function FacultyEditor() {
  return (
    <ListSection
      sectionKey="faculty"
      title="Faculty"
      intro="Faculty mentors shown on the About page."
      viewHref="/about#faculty"
      noun="faculty member"
      defs={FACULTY_DEFS}
      newItem={() => ({ name: "", designation: "", role: "", period: "", description: "", image: "" })}
      titleOf={(f) => String(f.name ?? "")}
      thumbOf={(f) => String(f.image ?? "")}
      subtitleOf={(f) => String(f.designation ?? f.role ?? "")}
    />
  );
}

/* ============================================================================
   TESTIMONIALS
   ============================================================================ */

const TESTIMONIAL_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 60 },
  { key: "role", label: "Role / batch", half: true, placeholder: "Member, 2025", maxLength: 80 },
  { key: "quote", label: "What they said", type: "textarea", required: true, rows: 4, maxLength: 500 },
  {
    key: "rating",
    label: "Star rating",
    type: "select",
    numeric: true,
    half: true,
    options: [
      { value: "", label: "No stars" },
      { value: "5", label: "5 stars" },
      { value: "4", label: "4 stars" },
      { value: "3", label: "3 stars" },
      { value: "2", label: "2 stars" },
      { value: "1", label: "1 star" },
    ],
  },
  { key: "image", label: "Photo", type: "image", folder: "team", maxSide: 800, help: IMG_HELP },
];

export function TestimonialsEditor() {
  return (
    <ListSection
      sectionKey="testimonials"
      title="Testimonials"
      intro="Member quotes in the slider on the About page."
      viewHref="/about#testimonials"
      noun="testimonial"
      defs={TESTIMONIAL_DEFS}
      newItem={() => ({ name: "", role: "", quote: "", rating: 5, image: "" })}
      titleOf={(t) => String(t.name ?? "")}
      thumbOf={(t) => String(t.image ?? "")}
      subtitleOf={(t) => String(t.quote ?? "").slice(0, 70)}
    />
  );
}