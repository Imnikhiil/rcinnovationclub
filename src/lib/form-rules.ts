/**
 * One set of rules for the three public forms (Contact, Join, Newsletter).
 * The server route checks them for real; the forms use the same numbers for their maxLength attributes.
 * supabase/spam-protection.sql enforces the same limits inside the database, so even a request that skips
 * this website cannot store huge or broken data.
 */

export const LIMITS = {
  name: 100,
  email: 254,
  subject: 150,
  message: 3000,
  messageMin: 10,
  enrollment: 30,
  course: 100,
  semester: 50,
  phone: 20,
  skills: 500,
  interests: 500,
  reason: 2000,
} as const;

export const CONTACT_SUBJECTS = ["General Inquiry", "Collaboration", "Sponsorship", "Event Query", "Feedback", "Other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;
const ENROLLMENT_RE = /^[A-Za-z0-9/\-_. ]+$/;

/** text only; removes invisible control characters (keeps normal line breaks) */
function clean(v: unknown): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "";
}

export type Validated<T> = { ok: true; value: T } | { ok: false; message: string };
type Input = Record<string, unknown>;

function tooLong(label: string, v: string, max: number): string | null {
  return v.length > max ? `${label} is too long (maximum ${max} characters).` : null;
}

export function validateContact(i: Input): Validated<{ name: string; email: string; subject: string; message: string }> {
  const v = { name: clean(i.name), email: clean(i.email), subject: clean(i.subject), message: clean(i.message) };
  if (!v.name || !v.email || !v.subject || !v.message) return { ok: false, message: "Please fill in all required fields." };
  if (!EMAIL_RE.test(v.email)) return { ok: false, message: "Please enter a valid email address." };
  if (!CONTACT_SUBJECTS.includes(v.subject)) return { ok: false, message: "Please choose a subject from the list." };
  if (v.message.length < LIMITS.messageMin) return { ok: false, message: `Message must be at least ${LIMITS.messageMin} characters.` };
  const long = tooLong("Name", v.name, LIMITS.name) || tooLong("Email", v.email, LIMITS.email) || tooLong("Message", v.message, LIMITS.message);
  return long ? { ok: false, message: long } : { ok: true, value: v };
}

export function validateMembership(i: Input): Validated<{
  name: string; enrollment: string; course: string; semester: string; email: string; phone: string; skills: string; interests: string; reason: string;
}> {
  const v = {
    name: clean(i.name),
    enrollment: clean(i.enrollmentNumber),
    course: clean(i.course),
    semester: clean(i.semester),
    email: clean(i.email),
    phone: clean(i.phone),
    skills: clean(i.skills),
    interests: clean(i.interests),
    reason: clean(i.reason),
  };
  if (!v.name || !v.enrollment || !v.course || !v.semester || !v.email || !v.phone || !v.reason) return { ok: false, message: "Please fill in all required fields." };
  if (!EMAIL_RE.test(v.email)) return { ok: false, message: "Please enter a valid email address." };
  if (!PHONE_RE.test(v.phone)) return { ok: false, message: "Please enter a valid phone number." };
  if (!ENROLLMENT_RE.test(v.enrollment)) return { ok: false, message: "Enrollment number can only contain letters, numbers and - / _ ." };
  const long =
    tooLong("Name", v.name, LIMITS.name) || tooLong("Enrollment number", v.enrollment, LIMITS.enrollment) || tooLong("Course", v.course, LIMITS.course) ||
    tooLong("Semester", v.semester, LIMITS.semester) || tooLong("Email", v.email, LIMITS.email) || tooLong("Skills", v.skills, LIMITS.skills) ||
    tooLong("Interests", v.interests, LIMITS.interests) || tooLong("Reason", v.reason, LIMITS.reason);
  return long ? { ok: false, message: long } : { ok: true, value: v };
}

export function validateNewsletter(i: Input): Validated<{ email: string }> {
  const email = clean(i.email).toLowerCase();
  if (!email) return { ok: false, message: "Please enter your email address." };
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return { ok: false, message: "Please enter a valid email address." };
  return { ok: true, value: { email } };
}