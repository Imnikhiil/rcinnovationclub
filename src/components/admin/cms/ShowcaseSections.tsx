"use client";

import ListSection from "./ListSection";
import type { FieldDef } from "./fields";

const IMG_HELP = "Upload a photo, or paste a link (https://…) or a site path like assets/projects/name.webp.";

/* ============================================================================
   LEGACY TIMELINE
   ============================================================================ */

const LEGACY_DEFS: FieldDef[] = [
  { key: "year", label: "Year", required: true, half: true, placeholder: "2025", maxLength: 20 },
  { key: "title", label: "Title", required: true, half: true, maxLength: 80 },
  { key: "description", label: "What happened", type: "textarea", rows: 3, maxLength: 500 },
];

export function LegacyEditor() {
  return (
    <ListSection
      sectionKey="legacy"
      title="Club timeline"
      intro="Milestones shown as a timeline on the About page, oldest first."
      viewHref="/about#legacy"
      noun="milestone"
      defs={LEGACY_DEFS}
      newItem={() => ({ year: "", title: "", description: "" })}
      titleOf={(l) => `${l.year ?? ""} ${l.title ?? ""}`.trim()}
    />
  );
}

/* ============================================================================
   PARTNERS
   ============================================================================ */

const PARTNER_DEFS: FieldDef[] = [
  { key: "name", label: "Name", required: true, half: true, maxLength: 80 },
  {
    key: "type",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "sponsor", label: "Sponsor" },
      { value: "partner", label: "Partner" },
      { value: "collaborator", label: "Collaborator" },
    ],
  },
  { key: "logo", label: "Logo", type: "image", folder: "partners", maxSide: 600, help: "Upload a logo, or paste a link (https://…). If empty, the name is shown instead." },
  { key: "url", label: "Website", type: "url", placeholder: "https://…" },
  { key: "description", label: "About", type: "textarea", rows: 3, maxLength: 300 },
];

export function PartnersEditor() {
  return (
    <ListSection
      sectionKey="partners"
      title="Partners & sponsors"
      intro="Shown in the scrolling strip on the home page and on the About page."
      viewHref="/#partners"
      noun="partner"
      defs={PARTNER_DEFS}
      newItem={() => ({ name: "", type: "partner", logo: "", url: "", description: "" })}
      titleOf={(p) => String(p.name ?? "")}
      thumbOf={(p) => String(p.logo ?? "")}
      subtitleOf={(p) => String(p.type ?? "")}
    />
  );
}

/* ============================================================================
   PROJECTS
   ============================================================================ */

const PROJECT_DEFS: FieldDef[] = [
  { key: "title", label: "Project name", required: true, maxLength: 100 },
  { key: "category", label: "Category", half: true, placeholder: "Web, AI, Robotics…", maxLength: 30 },
  {
    key: "status",
    label: "Status",
    type: "select",
    half: true,
    options: [
      { value: "completed", label: "Completed" },
      { value: "in-progress", label: "In progress" },
      { value: "planned", label: "Planned" },
    ],
  },
  { key: "description", label: "Description", type: "textarea", rows: 4, maxLength: 600 },
  { key: "tech", label: "Technologies", placeholder: "Python, Flask, HTML", maxLength: 150, help: "Separate with commas." },
  { key: "team", label: "Team", half: true, maxLength: 120 },
  { key: "image", label: "Photo", type: "image", folder: "projects", maxSide: 1400, half: true, help: IMG_HELP },
  { key: "githubUrl", label: "Code link", type: "url", half: true, placeholder: "https://github.com/…" },
  { key: "demoUrl", label: "Live demo link", type: "url", half: true, placeholder: "https://…" },
];

export function ProjectsEditor() {
  return (
    <ListSection
      sectionKey="projects"
      title="Projects"
      viewHref="/projects"
      noun="project"
      defs={PROJECT_DEFS}
      newItem={() => ({ title: "", category: "", status: "in-progress", description: "", tech: "", team: "", image: "", githubUrl: "", demoUrl: "" })}
      titleOf={(p) => String(p.title ?? "")}
      thumbOf={(p) => String(p.image ?? "")}
      subtitleOf={(p) => `${p.status ?? ""}${p.category ? ` · ${p.category}` : ""}`}
    />
  );
}

/* ============================================================================
   RESOURCES
   ============================================================================ */

const RESOURCE_DEFS: FieldDef[] = [
  { key: "title", label: "Title", required: true, maxLength: 100 },
  { key: "category", label: "Category", half: true, placeholder: "Guide, Workshop, Template…", maxLength: 30 },
  {
    key: "type",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "pdf", label: "PDF (Download button)" },
      { value: "doc", label: "Document (Download button)" },
      { value: "link", label: "Web link (Open button)" },
      { value: "slides", label: "Slides (Open button)" },
      { value: "video", label: "Video (Open button)" },
    ],
  },
  { key: "url", label: "Link to the file or page", type: "url", required: true, placeholder: "https://…" },
  { key: "description", label: "Description", type: "textarea", rows: 3, maxLength: 300 },
  { key: "tags", label: "Tags", placeholder: "Python, Beginner", maxLength: 100, help: "Separate with commas. Used by the search box." },
];

export function ResourcesEditor() {
  return (
    <ListSection
      sectionKey="resources"
      title="Resources"
      viewHref="/resources"
      noun="resource"
      defs={RESOURCE_DEFS}
      newItem={() => ({ title: "", category: "", type: "link", url: "", description: "", tags: "" })}
      titleOf={(r) => String(r.title ?? "")}
      subtitleOf={(r) => `${r.type ?? ""}${r.category ? ` · ${r.category}` : ""}`}
    />
  );
}