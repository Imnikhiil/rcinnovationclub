"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import CmsProvider, { useCms } from "./cms/CmsProvider";
import { AnnouncementEditor, EventsEditor, FaqEditor, RegistrationEditor } from "./cms/ContentSections";
import { AmbassadorsEditor, FacultyEditor, MembersEditor, PreviousMembersEditor, TeamEditor, TestimonialsEditor } from "./cms/PeopleSections";
import { GalleryEditor } from "./cms/GallerySection";
import { LegacyEditor, PartnersEditor, ProjectsEditor, ResourcesEditor } from "./cms/ShowcaseSections";
import { centerInRow, formatDate } from "@/lib/utils";

const TABS: { key: string; label: string; render: () => React.ReactNode }[] = [
  { key: "events", label: "Events", render: () => <EventsEditor /> },
  { key: "gallery", label: "Gallery", render: () => <GalleryEditor /> },
  { key: "announcement", label: "Announcement bar", render: () => <AnnouncementEditor /> },
  { key: "registration", label: "Registration", render: () => <RegistrationEditor /> },
  { key: "faq", label: "FAQ", render: () => <FaqEditor /> },
  { key: "team", label: "Core team", render: () => <TeamEditor /> },
  { key: "ambassadors", label: "Ambassadors", render: () => <AmbassadorsEditor /> },
  { key: "members", label: "Members", render: () => <MembersEditor /> },
  { key: "previous", label: "Previous members", render: () => <PreviousMembersEditor /> },
  { key: "faculty", label: "Faculty", render: () => <FacultyEditor /> },
  { key: "legacy", label: "Timeline", render: () => <LegacyEditor /> },
  { key: "testimonials", label: "Testimonials", render: () => <TestimonialsEditor /> },
  { key: "partners", label: "Partners", render: () => <PartnersEditor /> },
  { key: "projects", label: "Projects", render: () => <ProjectsEditor /> },
  { key: "resources", label: "Resources", render: () => <ResourcesEditor /> },
];

function Hub() {
  const cms = useCms();
  const [tab, setTab] = useState("events");

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);

  function pick(key: string, el: HTMLElement) {
    setTab(key);
    history.replaceState(null, "", `#${key}`);
    centerInRow(el);
  }

  if (cms.status === "loading" && !cms.updatedAt && Object.keys(cms.data).length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Loading website content…</p>;
  }

  if (cms.status === "error") {
    return (
      <div className="card mx-auto max-w-md p-7 text-center">
        <h1 className="font-display text-xl font-bold">Could not load content</h1>
        <p className="mt-2 text-sm text-muted">{cms.error}</p>
        <button type="button" onClick={() => void cms.reload()} className="btn btn-primary mt-5"><RefreshCw size={16} /> Try again</button>
      </div>
    );
  }

  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Website content</h1>
        <p className="mt-1 text-sm text-muted">
          {cms.updatedAt
            ? `Last saved ${formatDate(cms.updatedAt)}${cms.updatedBy ? ` by ${cms.updatedBy}` : ""}.`
            : "Nothing has been saved yet: the website uses its built-in content."}{" "}
          Changes go live when you press <strong>Save changes</strong>.
        </p>
      </div>

      <div className="chip-row !justify-start" role="tablist" aria-label="Content sections">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} data-active={tab === t.key} className="chip" onClick={(e) => pick(t.key, e.currentTarget)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* key = remount (fresh draft) when switching tabs */}
      <div key={current.key}>{current.render()}</div>
    </div>
  );
}

export default function ContentHub() {
  return (
    <CmsProvider>
      <Hub />
    </CmsProvider>
  );
}