"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { sbInsert } from "@/lib/supabase";
import { fillTemplate, sendNotification } from "@/lib/notify";
import { isEmail, uid } from "@/lib/utils";
import type { NotifyConfig } from "@/lib/types";

const SUBJECTS = ["General Inquiry", "Collaboration", "Sponsorship", "Event Query", "Feedback", "Other"];

interface Labels {
  nameLabel: string;
  emailLabel: string;
  subjectLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
}

export default function ContactForm({ labels, notify }: { labels: Labels; notify: NotifyConfig }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const msgRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error || done) msgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, done]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const subject = String(fd.get("subject") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || !email || !subject || !message) return setError("Please fill in all required fields.");
    if (!isEmail(email)) return setError("Please enter a valid email address.");
    if (message.length < 10) return setError("Message must be at least 10 characters.");

    setBusy(true);
    const res = await sbInsert("contact_messages", {
      id: uid("msg"),
      name,
      email,
      subject,
      message,
      status: "unread",
      submitted_at: new Date().toISOString(),
    });
    setBusy(false);

    if (!res.ok) return setError("Could not send message. Please try again later.");

    form.reset();
    setDone(labels.successMessage);
    if (notify.onContact) {
      void sendNotification(
        notify,
        fillTemplate(notify.contactSubject, { subject, name }),
        `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        email,
        name,
      );
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">{labels.nameLabel} <span className="text-accent">*</span></label>
          <input id="contact-name" name="name" required autoComplete="name" placeholder="Your name" className="field" />
        </div>
        <div>
          <label htmlFor="contact-email" className="label">{labels.emailLabel} <span className="text-accent">*</span></label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="label">{labels.subjectLabel} <span className="text-accent">*</span></label>
        <select id="contact-subject" name="subject" required defaultValue="" className="field">
          <option value="" disabled>Select a subject</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="label">{labels.messageLabel} <span className="text-accent">*</span></label>
        <textarea id="contact-message" name="message" rows={5} required placeholder="How can we help you?" className="field resize-y" />
      </div>
      {error ? <p ref={msgRef} role="alert" className="msg-error">{error}</p> : null}
      {done ? <p ref={msgRef} role="status" className="msg-success">{done}</p> : null}
      <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60 sm:w-auto">
        <Send size={17} /> {busy ? "Sending…" : labels.submitLabel}
      </button>
    </form>
  );
}