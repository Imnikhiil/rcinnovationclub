"use client";

import { useState } from "react";
import { useCms } from "./CmsProvider";
import SectionEditor from "./SectionEditor";
import ListSection from "./ListSection";
import { FormFields, getPath, setPath, trimObject, cleanLines, validateFields, type FieldDef, type FieldErrors, type Obj } from "./fields";
import { useAdmin } from "../AdminShell";

/** trim every text value, also inside nested objects (e.g. seo.pages.about.title) */
function deepTrim<T>(v: T): T {
  if (typeof v === "string") return v.trim() as unknown as T;
  if (Array.isArray(v)) return v.map(deepTrim) as unknown as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Obj).map(([k, x]) => [k, deepTrim(x)])) as unknown as T;
  return v;
}

/* ============================================================================
   FIELD LISTS
   ============================================================================ */

const HEAD: FieldDef[] = [
  { key: "eyebrow", label: "Small heading (above the title)", half: true, maxLength: 60 },
  { key: "title", label: "Title", half: true, required: true, maxLength: 100 },
  { key: "subtitle", label: "Sub-heading", type: "textarea", rows: 2, maxLength: 300 },
];

const HTTPS = /^https:\/\/\S+$/i;
const HTTPS_MSG = "Must start with https://";

const SEO_PAGES: [string, string][] = [
  ["home", "Home"], ["about", "About"], ["events", "Events"], ["team", "Team"], ["projects", "Projects"],
  ["gallery", "Gallery"], ["resources", "Resources"], ["join", "Join"], ["contact", "Contact"],
];

const SEO_DEFS: FieldDef[] = [
  { key: "siteName", label: "Site name", required: true, half: true, maxLength: 60 },
  { key: "siteUrl", label: "Website address", required: true, half: true, type: "url", pattern: /^https?:\/\/[^\s/]+\S*$/i, patternMessage: "Must be a full address like https://yourclub.com", help: "Your real website address. Used in Google results, the sitemap and share previews." },
  { key: "defaultImage", label: "Share picture", type: "image", folder: "seo", maxSide: 1600, help: "The picture shown when someone shares the site link (best size 1200×630)." },
  { key: "organizationName", label: "Organization name", half: true, maxLength: 80 },
  { key: "twitterHandle", label: "X / Twitter handle (optional)", half: true, placeholder: "@rc_innovationclub", pattern: /^@?[A-Za-z0-9_]{1,15}$/, patternMessage: "Example: @rc_innovationclub", maxLength: 20 },
  {
    key: "robots",
    label: "Search engines",
    type: "select",
    options: [
      { value: "index, follow", label: "Allow Google to list the site (normal)" },
      { value: "noindex, nofollow", label: "Hide the whole site from Google" },
    ],
    help: "Leave on “Allow”. Only hide the site while you are testing.",
  },
  ...SEO_PAGES.flatMap(([k, label]): FieldDef[] => [
    { key: `_seo_${k}`, label: `${label} page in Google`, type: "heading" },
    { key: `pages.${k}.title`, label: "Title", maxLength: 70, help: "About 60 characters works best." },
    { key: `pages.${k}.description`, label: "Description", type: "textarea", rows: 2, maxLength: 170 },
    { key: `pages.${k}.keywords`, label: "Keywords", maxLength: 200, help: "Separate with commas." },
  ]),
  { key: "_share", label: "Share buttons (in the footer)", type: "heading" },
  { key: "share.enabled", label: "Show the “Share this site” buttons", type: "boolean" },
  { key: "share.sectionLabel", label: "Label", half: true, maxLength: 40 },
  { key: "share.title", label: "Share title", half: true, maxLength: 100 },
  { key: "share.text", label: "Share message", type: "textarea", rows: 2, maxLength: 200 },
  { key: "share.platforms", label: "Buttons", type: "lines", rows: 5, help: "One per line, from: whatsapp, twitter, facebook, linkedin, telegram, copy." },
  { key: "share.copySuccess", label: "“Link copied” message", half: true, maxLength: 80 },
  { key: "share.copyError", label: "“Could not copy” message", half: true, maxLength: 120 },
];

const SHARE_OK = ["whatsapp", "twitter", "facebook", "linkedin", "telegram", "copy"];

function normalizeSeo(d: Obj): Obj {
  const out = deepTrim(d);
  if (typeof out.siteUrl === "string") out.siteUrl = out.siteUrl.replace(/\/+$/, "");
  const platforms = cleanLines(getPath(out, "share.platforms")).map((p) => p.toLowerCase()).filter((p) => SHARE_OK.includes(p));
  return setPath(out, "share.platforms", Array.from(new Set(platforms)));
}

const NOTIFY_DEFS: FieldDef[] = [
  { key: "enabled", label: "Email me when someone uses the Contact or Join form", type: "boolean" },
  { key: "web3formsAccessKey", label: "Web3Forms access key", maxLength: 80, help: "Get a free key at web3forms.com. Without it, no emails are sent (messages are still saved in the admin panel)." },
  { key: "notifyEmail", label: "Send emails to", type: "email", half: true },
  { key: "notifyOnContact", label: "Email for Contact messages", type: "boolean", half: true },
  { key: "notifyOnMembership", label: "Email for Join applications", type: "boolean", half: true },
  { key: "contactSubject", label: "Contact email subject", maxLength: 150, help: "You can use {subject} and {name}." },
  { key: "membershipSubject", label: "Join email subject", maxLength: 150, help: "You can use {name} and {enrollment}." },
];

const STAT_ICONS = [
  { value: "fas fa-calendar-check", label: "Calendar" },
  { value: "fas fa-users", label: "People" },
  { value: "fas fa-clock", label: "Clock" },
  { value: "fas fa-graduation-cap", label: "Graduation cap" },
  { value: "", label: "Star (default)" },
];

const STAT_DEFS: FieldDef[] = [
  { key: "label", label: "Label", required: true, half: true, maxLength: 40, placeholder: "Events Hosted" },
  { key: "value", label: "Number", type: "number", required: true, half: true, help: "The number counts up when visitors scroll to it." },
  { key: "prefix", label: "Before the number", half: true, maxLength: 5, placeholder: "e.g. ₹" },
  { key: "suffix", label: "After the number", half: true, maxLength: 5, placeholder: "e.g. +" },
  { key: "icon", label: "Icon", type: "select", half: true, options: STAT_ICONS },
  {
    key: "accent",
    label: "Colour",
    type: "select",
    half: true,
    options: [
      { value: "sky", label: "Blue" },
      { value: "indigo", label: "Purple" },
      { value: "emerald", label: "Green" },
      { value: "amber", label: "Yellow" },
    ],
  },
  { key: "description", label: "Small description", maxLength: 100 },
];

/* ============================================================================
   REGISTRY: every plain-text section of the website
   ============================================================================ */

interface TextEntry {
  key: string;
  group: string;
  label: string;
  intro?: string;
  viewHref?: string;
  defs: FieldDef[];
  /** only the Super Admin sees it (it affects the whole site or where emails go) */
  superOnly?: boolean;
  normalize?: (d: Obj) => Obj;
}

const TEXT_ENTRIES: TextEntry[] = [
  { key: "hero", group: "Home page", label: "Top banner (hero)", viewHref: "/", defs: [
    { key: "badge", label: "Small badge", maxLength: 60 },
    { key: "title", label: "Title (first part)", required: true, half: true, maxLength: 60 },
    { key: "titleHighlight", label: "Title (coloured part)", half: true, maxLength: 60 },
    { key: "description", label: "Description", type: "textarea", rows: 3, maxLength: 300 },
    { key: "btnPrimary", label: "First button", half: true, maxLength: 30 },
    { key: "btnSecondary", label: "Second button", half: true, maxLength: 30 },
  ] },
  { key: "statsSection", group: "Home page", label: "Numbers: heading", viewHref: "/#stats", intro: "The numbers themselves are in the “Numbers” tab.", defs: [{ key: "enabled", label: "Show the numbers section on the home page", type: "boolean" }, ...HEAD] },

  { key: "about", group: "About page", label: "Intro, mission & vision", viewHref: "/about", defs: [
    ...HEAD,
    { key: "mission", label: "Mission", type: "textarea", rows: 3, maxLength: 400 },
    { key: "vision", label: "Vision", type: "textarea", rows: 3, maxLength: 400 },
    { key: "culture", label: "Culture", type: "textarea", rows: 2, maxLength: 300 },
  ] },
  { key: "facultySection", group: "About page", label: "Faculty: heading", viewHref: "/about#faculty", defs: HEAD },
  { key: "legacySection", group: "About page", label: "Timeline: heading", viewHref: "/about#legacy", defs: HEAD },
  { key: "testimonialsSection", group: "About page", label: "Testimonials: heading", viewHref: "/about#testimonials", defs: HEAD },
  { key: "partnersSection", group: "About page", label: "Partners: heading", viewHref: "/about#partners", defs: HEAD },

  { key: "eventsSection", group: "Other pages", label: "Events page", viewHref: "/events", defs: [...HEAD, { key: "upcomingTitle", label: "“Upcoming” heading", half: true, maxLength: 40 }, { key: "pastTitle", label: "“Past” heading", half: true, maxLength: 40 }] },
  { key: "teamHierarchySection", group: "Other pages", label: "Team: filter buttons", viewHref: "/team", defs: [{ key: "enabled", label: "Show the filter buttons on the Team page", type: "boolean" }, { key: "hint", label: "Hint text", type: "textarea", rows: 2, maxLength: 200 }] },
  { key: "coreSection", group: "Other pages", label: "Team: core team heading", viewHref: "/team", defs: HEAD },
  { key: "ambassadorsSection", group: "Other pages", label: "Team: ambassadors heading", viewHref: "/team#ambassadors", defs: HEAD },
  { key: "membersSection", group: "Other pages", label: "Team: members headings", viewHref: "/team#members", defs: [...HEAD, { key: "currentTitle", label: "Current members heading", half: true, maxLength: 60 }, { key: "previousTitle", label: "Previous members heading", half: true, maxLength: 60 }] },
  { key: "projectsSection", group: "Other pages", label: "Projects page", viewHref: "/projects", defs: HEAD },
  { key: "gallerySection", group: "Other pages", label: "Gallery page", viewHref: "/gallery", defs: HEAD },
  { key: "resourcesSection", group: "Other pages", label: "Resources page", viewHref: "/resources", defs: HEAD },

  { key: "join", group: "Join & Contact", label: "Join page", viewHref: "/join", defs: [
    { key: "eyebrow", label: "Small heading", half: true, maxLength: 60 },
    { key: "title", label: "Title", half: true, required: true, maxLength: 100 },
    { key: "description", label: "Description", type: "textarea", rows: 3, maxLength: 400 },
    { key: "btnInstagram", label: "Instagram button", half: true, maxLength: 40 },
    { key: "btnWhatsapp", label: "WhatsApp button", half: true, maxLength: 40 },
  ] },
  { key: "contactSection", group: "Join & Contact", label: "Contact page", viewHref: "/contact", defs: [
    ...HEAD,
    { key: "nameLabel", label: "“Name” label", half: true, maxLength: 40 },
    { key: "emailLabel", label: "“Email” label", half: true, maxLength: 40 },
    { key: "subjectLabel", label: "“Subject” label", half: true, maxLength: 40 },
    { key: "messageLabel", label: "“Message” label", half: true, maxLength: 40 },
    { key: "submitLabel", label: "Send button", half: true, maxLength: 40 },
    { key: "successMessage", label: "Message after sending", type: "textarea", rows: 2, maxLength: 300 },
  ] },
  { key: "certificatesSection", group: "Join & Contact", label: "Certificate check (Resources page)", viewHref: "/resources#certificates", defs: [
    { key: "enabled", label: "Show the certificate check", type: "boolean" },
    ...HEAD,
    { key: "verifyLabel", label: "Field label", half: true, maxLength: 60 },
    { key: "verifyPlaceholder", label: "Field example", half: true, maxLength: 60 },
    { key: "verifyHint", label: "Hint under the field", maxLength: 150 },
    { key: "verifyButton", label: "Button", half: true, maxLength: 40 },
    { key: "issuerName", label: "Issued by (name)", half: true, maxLength: 80 },
    { key: "issuerTitle", label: "Issued by (title)", maxLength: 80 },
    { key: "validMessage", label: "Message: valid certificate", type: "textarea", rows: 2, maxLength: 200 },
    { key: "invalidMessage", label: "Message: not found", type: "textarea", rows: 2, maxLength: 200 },
    { key: "revokedMessage", label: "Message: cancelled certificate", type: "textarea", rows: 2, maxLength: 200 },
  ] },
  { key: "newsletterSection", group: "Join & Contact", label: "Newsletter box", defs: [
    { key: "enabled", label: "Show the newsletter box at the bottom of pages", type: "boolean" },
    { key: "title", label: "Title", required: true, maxLength: 80 },
    { key: "subtitle", label: "Text", type: "textarea", rows: 2, maxLength: 200 },
    { key: "placeholder", label: "Email field hint", half: true, maxLength: 40 },
    { key: "buttonLabel", label: "Button", half: true, maxLength: 30 },
    { key: "successMessage", label: "Message after subscribing", type: "textarea", rows: 2, maxLength: 200 },
    { key: "privacyNote", label: "Small note", maxLength: 120 },
  ] },

  { key: "footer", group: "Whole site", label: "Footer text", intro: "Shown at the bottom of every page.", defs: [
    { key: "brand", label: "Club name", required: true, maxLength: 60 },
    { key: "description", label: "Short description", type: "textarea", rows: 3, maxLength: 300 },
    { key: "email", label: "Email shown in the footer", type: "email" },
    { key: "copyright", label: "Copyright line", maxLength: 200 },
  ] },
  { key: "social", group: "Whole site", label: "Social links", intro: "Used by the footer, the Join page and the Contact page.", defs: [
    { key: "instagram", label: "Instagram link", type: "url", pattern: HTTPS, patternMessage: HTTPS_MSG, placeholder: "https://www.instagram.com/…" },
    { key: "whatsapp", label: "WhatsApp channel link", type: "url", pattern: HTTPS, patternMessage: HTTPS_MSG, placeholder: "https://whatsapp.com/channel/…" },
    { key: "email", label: "Contact email", type: "email" },
  ] },

  { key: "seo", group: "Advanced (Super Admin)", label: "Google & share settings (SEO)", superOnly: true, intro: "How the site looks in Google and in WhatsApp/Instagram link previews.", viewHref: "/", defs: SEO_DEFS, normalize: normalizeSeo },
  { key: "notificationsSection", group: "Advanced (Super Admin)", label: "Email alerts", superOnly: true, defs: NOTIFY_DEFS },
  { key: "analyticsSection", group: "Advanced (Super Admin)", label: "Google Analytics", superOnly: true, intro: "Visitor numbers also appear in your Vercel dashboard. This only adds Google Analytics 4.", defs: [
    { key: "enabled", label: "Use Google Analytics when an ID is entered", type: "boolean" },
    { key: "ga4MeasurementId", label: "GA4 measurement ID", placeholder: "G-XXXXXXXXXX", pattern: /^G-[A-Za-z0-9]{4,20}$/, patternMessage: "Looks like G-ABC123XYZ9", help: "Leave empty for no Google Analytics." },
  ] },
];

/* ============================================================================
   EDITORS
   ============================================================================ */

function ObjectSection({ entry }: { entry: TextEntry }) {
  const cms = useCms();
  const initial = ((cms.effective as unknown as Obj)[entry.key] ?? {}) as Obj;

  return (
    <SectionEditor<Obj, FieldErrors>
      key={entry.key}
      sectionKey={entry.key}
      title={entry.label}
      intro={entry.intro}
      viewHref={entry.viewHref}
      initial={initial}
      validate={(d) => {
        const errors = validateFields(entry.defs, d);
        return { errors, count: Object.keys(errors).length };
      }}
      normalize={(d) => (entry.normalize ? entry.normalize(d) : trimObject(d))}
    >
      {({ draft, setDraft, errors }) => <FormFields defs={entry.defs} value={draft} onChange={setDraft} errors={errors} />}
    </SectionEditor>
  );
}

/** One dropdown to pick which piece of text to edit (each piece saves on its own). */
export function TextsHub() {
  const me = useAdmin();
  const cms = useCms();
  const entries = TEXT_ENTRIES.filter((e) => !e.superOnly || me.role === "super");
  const [key, setKey] = useState(entries[0].key);
  const entry = entries.find((e) => e.key === key) ?? entries[0];
  const groups = Array.from(new Set(entries.map((e) => e.group)));

  function pick(next: string) {
    if (cms.isDirty() && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    setKey(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="text-pick" className="label">Which text do you want to change?</label>
        <select id="text-pick" className="field" value={entry.key} onChange={(e) => pick(e.target.value)}>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {entries.filter((e) => e.group === g).map((e) => (
                <option key={e.key} value={e.key}>{e.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <ObjectSection key={entry.key} entry={entry} />
    </div>
  );
}

export function StatsEditor() {
  return (
    <ListSection
      sectionKey="stats"
      title="Numbers on the home page"
      intro="The animated counters (events hosted, members, students reached…)."
      viewHref="/#stats"
      noun="number"
      defs={STAT_DEFS}
      newItem={() => ({ label: "", value: 0, prefix: "", suffix: "+", icon: "", description: "", accent: "sky" })}
      titleOf={(s) => String(s.label ?? "")}
      subtitleOf={(s) => `${s.prefix ?? ""}${s.value ?? ""}${s.suffix ?? ""}`}
    />
  );
}