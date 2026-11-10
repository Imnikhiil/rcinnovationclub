"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Send, UserPlus, X } from "lucide-react";
import { sbInsert } from "@/lib/supabase";
import { fillTemplate, sendNotification } from "@/lib/notify";
import { isEmail, uid } from "@/lib/utils";
import type { NotifyConfig, RegistrationConfig } from "@/lib/types";

type Status = "loading" | "open" | "upcoming" | "closed" | "disabled";

function computeStatus(cfg: RegistrationConfig): Status {
  if (!cfg.enabled) return "disabled";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (cfg.startDate && today < new Date(cfg.startDate + "T00:00:00")) return "upcoming";
  if (cfg.endDate && now > new Date(cfg.endDate + "T23:59:59")) return "closed";
  return "open";
}

function prettyDate(d?: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function MembershipPanel({ registration, notify }: { registration: RegistrationConfig; notify: NotifyConfig }) {
  const [status, setStatus] = useState<Status>("loading");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error || done) msgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, done]);

  // Computed in the browser so the visitor's own date is used (and no server/client mismatch).
  useEffect(() => setStatus(computeStatus(registration)), [registration]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const v = (k: string) => String(fd.get(k) || "").trim();

    const enrollment = v("enrollmentNumber");
    const row = {
      id: uid("app"),
      name: v("name"),
      enrollment_number: enrollment,
      enrollment_number_lower: enrollment.toLowerCase(),
      course: v("course"),
      semester: v("semester"),
      email: v("email"),
      phone: v("phone"),
      skills: v("skills"),
      interests: v("interests"),
      reason: v("reason"),
      status: "pending",
      submitted_at: new Date().toISOString(),
    };

    if (!row.name || !row.enrollment_number || !row.course || !row.semester || !row.email || !row.phone || !row.reason) {
      return setError("Please fill in all required fields.");
    }
    if (!isEmail(row.email)) return setError("Please enter a valid email address.");

    setBusy(true);
    const res = await sbInsert("applications", row);
    setBusy(false);

    if (!res.ok) {
      // unique index on enrollment_number_lower = this enrollment already applied
      return setError(res.duplicate ? "An application with this enrollment number already exists." : "Could not submit application. Please try again later.");
    }

    form.reset();
    setDone(registration.successMessage || "Your application has been submitted successfully!");
    if (notify.onMembership) {
      void sendNotification(
        notify,
        fillTemplate(notify.membershipSubject, { name: row.name, enrollment }),
        `Name: ${row.name}\nEnrollment: ${enrollment}\nCourse: ${row.course}\nSemester: ${row.semester}\nEmail: ${row.email}\nPhone: ${row.phone}\nSkills: ${row.skills}\nInterests: ${row.interests}\n\nReason:\n${row.reason}`,
        row.email,
        row.name,
      );
    }
  }

  if (status === "loading") return <div className="mb-6 h-12" aria-hidden />;

  if (status !== "open") {
    const message =
      status === "upcoming"
        ? (registration.upcomingMessage || "Membership registration has not opened yet.").replace("{date}", prettyDate(registration.startDate) || "the opening date")
        : status === "closed"
          ? registration.expiredMessage || registration.closedMessage || "Membership registration has ended."
          : registration.disabledMessage || "Membership registration is not available at the moment.";
    const title = status === "upcoming" ? "Registration Not Open Yet" : "Registration Closed";
    return (
      <div role="status" className="mx-auto mb-6 flex max-w-xl items-start gap-3 rounded-2xl border border-[var(--border)] p-4 text-left">
        <Lock size={20} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <strong>{title}</strong>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <UserPlus size={18} /> Join RC Innovation Club
        </button>
      ) : (
        <div ref={panelRef} className="card mx-auto max-w-2xl scroll-mt-24 p-5 text-left sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Membership Registration</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close registration form" className="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--accent-soft)]">
              <X size={18} />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">Fill out the form below to apply for RC Innovation Club membership.</p>

          <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mem-name" name="name" label="Full Name" placeholder="Your full name" autoComplete="name" required />
              <Field id="mem-enrollment" name="enrollmentNumber" label="Enrollment Number" placeholder="e.g. 24CS001" required />
              <Field id="mem-course" name="course" label="Course" placeholder="e.g. B.Tech CSE" required />
              <Field id="mem-semester" name="semester" label="Semester" placeholder="e.g. 4th Semester" required />
              <Field id="mem-email" name="email" type="email" label="Email" placeholder="you@example.com" autoComplete="email" required />
              <Field id="mem-phone" name="phone" type="tel" label="Phone Number" placeholder="10-digit mobile number" autoComplete="tel" required />
            </div>
            <Field id="mem-skills" name="skills" label="Skills" placeholder="e.g. Python, Web Development, Robotics" />
            <Field id="mem-interests" name="interests" label="Interests" placeholder="e.g. AI, Hackathons, Design" />
            <div>
              <label htmlFor="mem-reason" className="label">Reason for Joining <span className="text-accent">*</span></label>
              <textarea id="mem-reason" name="reason" rows={3} required placeholder="Why do you want to join RC Innovation Club?" className="field resize-y" />
            </div>
            {error ? <p ref={msgRef} role="alert" className="msg-error">{error}</p> : null}
            {done ? <p ref={msgRef} role="status" className="msg-success">{done}</p> : null}
            <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60 sm:w-auto">
              <Send size={17} /> {busy ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ id, name, label, placeholder, type = "text", autoComplete, required }: {
  id: string; name: string; label: string; placeholder?: string; type?: string; autoComplete?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label} {required ? <span className="text-accent">*</span> : null}</label>
      <input id={id} name={name} type={type} required={required} autoComplete={autoComplete} placeholder={placeholder} className="field" />
    </div>
  );
}