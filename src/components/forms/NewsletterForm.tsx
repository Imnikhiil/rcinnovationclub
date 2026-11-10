"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { sbInsert } from "@/lib/supabase";
import { isEmail, uid } from "@/lib/utils";

interface Props {
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
}

export default function NewsletterForm({ placeholder, buttonLabel, successMessage }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    const value = email.trim().toLowerCase();
    if (!value) return setError("Please enter your email address.");
    if (!isEmail(value)) return setError("Please enter a valid email address.");

    setBusy(true);
    const res = await sbInsert("subscribers", { id: uid("sub"), email: value, subscribed_at: new Date().toISOString() });
    setBusy(false);

    if (res.ok) {
      setDone(successMessage || "You're subscribed!");
      setEmail("");
    } else if (res.duplicate) {
      setError("This email is already subscribed.");
    } else {
      setError("Could not subscribe. Please try again later.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={placeholder || "Enter your email"}
          aria-label="Email for newsletter"
          className="field flex-1"
        />
        <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-60">
          <Bell size={17} /> {busy ? "Please wait…" : buttonLabel || "Subscribe"}
        </button>
      </div>
      {error ? <p role="alert" className="msg-error mt-3">{error}</p> : null}
      {done ? <p role="status" className="msg-success mt-3">{done}</p> : null}
    </form>
  );
}