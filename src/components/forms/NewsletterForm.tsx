"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { submitForm } from "@/lib/forms-client";
import { useSpamGuard } from "./useSpamGuard";
import { LIMITS } from "@/lib/form-rules";
import { isEmail } from "@/lib/utils";

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
  // This box is on every page, so the Turnstile check appears only when someone starts typing.
  const spam = useSpamGuard(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    const value = email.trim().toLowerCase();
    if (!value) return setError("Please enter your email address.");
    if (!isEmail(value)) return setError("Please enter a valid email address.");
    if (spam.needsToken && !spam.hasToken) return setError("Please complete the verification check first.");

    setBusy(true);
    const res = await submitForm("newsletter", { email: value }, spam.extras());
    setBusy(false);
    spam.reset();

    if (res.ok) {
      setDone(successMessage || "You're subscribed!");
      setEmail("");
    } else if (res.code === "duplicate") {
      setError("This email is already subscribed.");
    } else if (res.code === "rate_limited") {
      setError("Too many submissions right now. Please try again in a few minutes.");
    } else if (res.code === "captcha") {
      setError("Verification failed. Please refresh the page and try again.");
    } else if (res.code === "invalid") {
      setError(res.message);
    } else {
      setError("Could not subscribe. Please try again later.");
    }
  }

  return (
    <form onSubmit={onSubmit} onFocusCapture={spam.arm} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={LIMITS.email}
          autoComplete="email"
          placeholder={placeholder || "Enter your email"}
          aria-label="Email for newsletter"
          className="field flex-1"
        />
        <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-60">
          <Bell size={17} /> {busy ? "Please wait…" : buttonLabel || "Subscribe"}
        </button>
      </div>
      {spam.guard}
      {error ? <p role="alert" className="msg-error mt-3">{error}</p> : null}
      {done ? <p role="status" className="msg-success mt-3">{done}</p> : null}
    </form>
  );
}