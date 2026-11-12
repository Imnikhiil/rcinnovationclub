"use client";

import { useCms } from "./CmsProvider";
import SectionEditor from "./SectionEditor";
import ListEditor from "./ListEditor";
import { FormFields, cleanObject, trimObject, validateFields, type FieldDef, type FieldErrors, type Obj } from "./fields";
import { getFaq, type FaqSection } from "@/lib/faq";
import { getRegistrationStatus } from "@/lib/registration";
import { formatDate, isUpcomingEvent } from "@/lib/utils";
import type { EventItem, RegistrationConfig } from "@/lib/types";

/** validate a whole list: returns errors per item index */
function validateList(items: Obj[], defs: FieldDef[]) {
  const errors: Record<number, FieldErrors> = {};
  let count = 0;
  items.forEach((it, i) => {
    const e = validateFields(defs, it);
    const n = Object.keys(e).length;
    if (n) {
      errors[i] = e;
      count += n;
    }
  });
  return { errors, count };
}

/* ============================================================================
   EVENTS
   ============================================================================ */

const EVENT_DEFS: FieldDef[] = [
  { key: "title", label: "Event name", required: true, maxLength: 120 },
  { key: "tag", label: "Label", half: true, placeholder: "Workshop, Hackathon, Seminar…", maxLength: 30, help: "Small tag shown on the card." },
  {
    key: "forceStatus",
    label: "Show as",
    type: "select",
    half: true,
    options: [
      { value: "", label: "Automatic (by date)" },
      { value: "upcoming", label: "Always Upcoming" },
      { value: "past", label: "Always Past" },
    ],
    help: "Leave on Automatic: the event becomes Past after its date.",
  },
  { key: "eventDate", label: "Event date", type: "date", half: true, help: "Needed for the countdown and for Upcoming/Past. Without a date the event shows as Past." },
  { key: "time", label: "Time", half: true, placeholder: "10:00 AM", maxLength: 40, help: "The countdown on the home page starts from this time." },
  { key: "date", label: "Date text on the card (optional)", placeholder: "5–6 December 2026", maxLength: 60, help: "Only if you want different wording than the date above." },
  { key: "venue", label: "Venue", maxLength: 120 },
  { key: "description", label: "Description", type: "textarea", rows: 4, maxLength: 1000 },
  { key: "image", label: "Photo", type: "image", help: "A photo link (https://…) or a site path like assets/events/name.webp. Photo upload is coming in a later update." },
  { key: "registerUrl", label: "Register link", type: "url", half: true, placeholder: "https://forms.gle/…", help: "Leave empty for no Register button." },
  { key: "registerLabel", label: "Button text", half: true, placeholder: "Register Now", maxLength: 30 },
];

export function EventsEditor() {
  const cms = useCms();
  const initial = cms.effective.events as unknown as Obj[];

  return (
    <SectionEditor<Obj[], Record<number, FieldErrors>>
      sectionKey="events"
      title="Events"
      intro="Add, edit or remove events. Upcoming events show on the home page, the Events page and the countdown."
      viewHref="/events"
      initial={initial}
      validate={(d) => validateList(d, EVENT_DEFS)}
      normalize={(d) => d.map((it) => cleanObject(it))}
    >
      {({ draft, setDraft, errors }) => (
        <ListEditor
          items={draft}
          onChange={setDraft}
          defs={EVENT_DEFS}
          noun="event"
          errors={errors}
          newItem={() => ({ title: "", tag: "", eventDate: "", time: "", venue: "", description: "", image: "", registerUrl: "", registerLabel: "Register Now" })}
          title={(e) => String(e.title ?? "")}
          subtitle={(e) => {
            const ev = e as unknown as EventItem;
            const up = isUpcomingEvent(ev);
            const when = ev.date || formatDate(ev.eventDate) || "No date";
            const noDate = !ev.eventDate && ev.forceStatus !== "upcoming";
            return (
              <>
                <span className={up ? "text-emerald-300" : "text-slate-400"}>{up ? "Upcoming" : "Past"}</span> · {when}
                {noDate ? <span className="text-amber-300"> · add a date, or it shows as Past</span> : null}
              </>
            );
          }}
          toolbar={
            <button
              type="button"
              className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"
              onClick={() => setDraft([...draft].sort((a, b) => String(b.eventDate ?? "").localeCompare(String(a.eventDate ?? ""))))}
            >
              Sort by date (newest first)
            </button>
          }
        />
      )}
    </SectionEditor>
  );
}

/* ============================================================================
   ANNOUNCEMENT BAR
   ============================================================================ */

const ANN_DEFS: FieldDef[] = [
  { key: "enabled", label: "Show the announcement bar on every page", type: "boolean" },
  { key: "message", label: "Message", type: "textarea", rows: 2, maxLength: 160, help: "Keep it short: one line on a phone." },
  { key: "linkLabel", label: "Link text", half: true, placeholder: "View Events", maxLength: 30 },
  { key: "linkUrl", label: "Link address", type: "url", half: true, placeholder: "/events or https://…", help: "Leave both link fields empty for no link." },
  { key: "dismissible", label: "Visitors can close the bar", type: "boolean" },
];

export function AnnouncementEditor() {
  const cms = useCms();
  const initial = cms.effective.announcementBar as unknown as Obj;

  return (
    <SectionEditor<Obj, FieldErrors>
      sectionKey="announcementBar"
      title="Announcement bar"
      intro="The coloured strip at the very top of the website."
      initial={initial}
      validate={(d) => {
        const errors = validateFields(ANN_DEFS, d);
        if (d.enabled === true && !String(d.message ?? "").trim()) errors.message = "Write a message, or switch the bar off";
        return { errors, count: Object.keys(errors).length };
      }}
      normalize={(d, init) => {
        const out = trimObject(d);
        // A new message needs a new id, otherwise people who already closed the old bar would never see it.
        const changed = ["message", "linkUrl", "linkLabel"].some((k) => out[k] !== String(init[k] ?? "").trim());
        if (changed) out.announcementId = `announcement-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
        return out;
      }}
      aside={(d) =>
        d.enabled === true && String(d.message ?? "").trim() ? (
          <div>
            <p className="label">Preview</p>
            <div className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-[var(--on-accent)]" style={{ background: "var(--gradient-brand)" }}>
              {String(d.message)} {d.linkLabel ? <u>{String(d.linkLabel)}</u> : null}
            </div>
          </div>
        ) : null
      }
    >
      {({ draft, setDraft, errors }) => <FormFields defs={ANN_DEFS} value={draft} onChange={setDraft} errors={errors} />}
    </SectionEditor>
  );
}

/* ============================================================================
   MEMBERSHIP REGISTRATION
   ============================================================================ */

const REG_DEFS: FieldDef[] = [
  { key: "enabled", label: "Membership registration is ON", type: "boolean" },
  { key: "startDate", label: "Opens on", type: "date", half: true, help: "Empty = no start date." },
  { key: "endDate", label: "Closes on (last day included)", type: "date", half: true, help: "Empty = no end date." },
  { key: "upcomingMessage", label: "Message before it opens", type: "textarea", rows: 2, maxLength: 400, help: "You can write {date} and it becomes the opening date." },
  { key: "expiredMessage", label: "Message after it closes", type: "textarea", rows: 2, maxLength: 400 },
  { key: "disabledMessage", label: "Message when registration is switched OFF", type: "textarea", rows: 2, maxLength: 400 },
  { key: "successMessage", label: "Message after someone applies", type: "textarea", rows: 2, maxLength: 400 },
];

const STATUS_TEXT: Record<string, { label: string; cls: string }> = {
  open: { label: "OPEN: the Join form is visible and the Join bar is shown on phones", cls: "msg-success" },
  upcoming: { label: "NOT OPEN YET: visitors see the “not open yet” message", cls: "msg-error" },
  closed: { label: "CLOSED: visitors see the “closed” message", cls: "msg-error" },
  disabled: { label: "SWITCHED OFF: visitors see the “not available” message", cls: "msg-error" },
};

export function RegistrationEditor() {
  const cms = useCms();
  const initial = cms.effective.registration as unknown as Obj;

  return (
    <SectionEditor<Obj, FieldErrors>
      sectionKey="registration"
      title="Membership registration"
      intro="Controls the “Join RC Innovation Club” form on the Join page."
      viewHref="/join"
      initial={initial}
      validate={(d) => {
        const errors = validateFields(REG_DEFS, d);
        const s = String(d.startDate ?? "");
        const e = String(d.endDate ?? "");
        if (s && e && e < s) errors.endDate = "Must be on or after the opening date";
        return { errors, count: Object.keys(errors).length };
      }}
      normalize={(d) => {
        const out = trimObject(d);
        out.closedMessage = out.expiredMessage ?? ""; // older field, keep both in sync
        return out;
      }}
      aside={(d) => {
        const st = getRegistrationStatus(d as unknown as RegistrationConfig);
        return <p className={STATUS_TEXT[st].cls}>Right now: {STATUS_TEXT[st].label}</p>;
      }}
    >
      {({ draft, setDraft, errors }) => <FormFields defs={REG_DEFS} value={draft} onChange={setDraft} errors={errors} />}
    </SectionEditor>
  );
}

/* ============================================================================
   FAQ
   ============================================================================ */

const FAQ_TOP: FieldDef[] = [
  { key: "enabled", label: "Show the FAQ on the Join page", type: "boolean" },
  { key: "eyebrow", label: "Small heading", half: true, maxLength: 40 },
  { key: "title", label: "Heading", half: true, maxLength: 80 },
  { key: "subtitle", label: "Sub-heading", type: "textarea", rows: 2, maxLength: 200 },
];
const FAQ_ITEM: FieldDef[] = [
  { key: "question", label: "Question", required: true, maxLength: 200 },
  { key: "answer", label: "Answer", type: "textarea", required: true, rows: 4, maxLength: 1200 },
];

interface FaqErrors {
  top: FieldErrors;
  items: Record<number, FieldErrors>;
}

export function FaqEditor() {
  const cms = useCms();
  const initial = getFaq(cms.effective);

  return (
    <SectionEditor<FaqSection, FaqErrors>
      sectionKey="faqSection"
      title="FAQ (Join page)"
      intro="Questions and answers shown at the bottom of the Join page."
      viewHref="/join#faq"
      initial={initial}
      validate={(d) => {
        const top = validateFields(FAQ_TOP, d as unknown as Obj);
        const li = validateList(d.items as unknown as Obj[], FAQ_ITEM);
        return { errors: { top, items: li.errors }, count: Object.keys(top).length + li.count };
      }}
      normalize={(d) => ({ ...(trimObject(d as unknown as Obj) as unknown as FaqSection), items: (d.items as unknown as Obj[]).map((i) => cleanObject(i)) as unknown as FaqSection["items"] })}
    >
      {({ draft, setDraft, errors }) => (
        <div className="space-y-6">
          <FormFields defs={FAQ_TOP} value={draft as unknown as Obj} onChange={(v) => setDraft({ ...draft, ...(v as unknown as FaqSection) })} errors={errors?.top} />
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">Questions</h3>
            <ListEditor
              items={draft.items as unknown as Obj[]}
              onChange={(items) => setDraft({ ...draft, items: items as unknown as FaqSection["items"] })}
              defs={FAQ_ITEM}
              noun="question"
              errors={errors?.items}
              newItem={() => ({ question: "", answer: "" })}
              title={(i) => String(i.question ?? "")}
            />
          </div>
        </div>
      )}
    </SectionEditor>
  );
}