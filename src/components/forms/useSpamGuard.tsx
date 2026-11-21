"use client";

import { useCallback, useRef, useState } from "react";
import Turnstile from "./Turnstile";
import type { GuardExtras } from "@/lib/forms-client";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Bot protection for one form:
 *  - an invisible trap field that real people never fill,
 *  - the time the form was started (bots submit instantly),
 *  - Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Put {guard} inside the <form>. Call extras() when submitting and reset() after a successful or failed send.
 * lazy = show the Turnstile box only when the visitor first touches the form (use it for the newsletter box that is on every page);
 * then add onFocusCapture={arm} to the <form>.
 */
export function useSpamGuard(lazy = false) {
  const startedAt = useRef(Date.now());
  const trap = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState("");
  const [round, setRound] = useState(0);
  const [armed, setArmed] = useState(!lazy);

  const arm = useCallback(() => setArmed(true), []);
  const onToken = useCallback((t: string) => setToken(t), []);

  const guard = (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Leave this field empty
          <input ref={trap} type="text" name="hp_contact_field" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {SITE_KEY && armed ? (
        <div className="mt-1">
          <Turnstile key={round} siteKey={SITE_KEY} onToken={onToken} />
        </div>
      ) : null}
    </>
  );

  const extras = (): GuardExtras => ({ hp: trap.current?.value ?? "", t: startedAt.current, token });

  /** a Turnstile answer works only once, so ask for a fresh one after every send */
  const reset = () => {
    setToken("");
    setRound((r) => r + 1);
    startedAt.current = Date.now();
  };

  return { guard, extras, reset, arm, needsToken: !!SITE_KEY, hasToken: token !== "" };
}