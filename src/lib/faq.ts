import type { Content } from "@/lib/content";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

/**
 * Built-in answers, written only from what the website itself already says.
 * Anything the CMS (Supabase cms_content -> "faqSection") provides replaces these field by field,
 * so the questions can be edited later without touching code. Set "enabled": false to hide the section.
 */
export const DEFAULT_FAQ: FaqSection = {
  enabled: true,
  eyebrow: "Got Questions?",
  title: "Frequently Asked Questions",
  subtitle: "Everything you need to know before you join RC Innovation Club.",
  items: [
    {
      question: "Who can join RC Innovation Club?",
      answer:
        "The club is open to all students at DSEU Rajokri Campus. You do not need to be an expert: the club is about building skills, working on real projects, and growing together with a community of creators.",
    },
    {
      question: "How do I apply for membership?",
      answer:
        "When registration is open, tap “Join RC Innovation Club” at the top of this page and fill in the form: your name, enrollment number, course, semester, email, phone number, skills, interests, and why you want to join. Then submit it.",
    },
    {
      question: "What happens after I submit the form?",
      answer:
        "Your application is saved as pending and our team reviews it. We will get back to you soon, so please keep your email and phone number correct.",
    },
    {
      question: "The form is closed. Can I still join?",
      answer:
        "Membership registration is open only for a fixed period, usually once a semester. When it is closed, follow us on Instagram and join our WhatsApp channel so you do not miss the next opening.",
    },
    {
      question: "Can I apply more than once?",
      answer:
        "No. Each enrollment number can apply only once. If you see a message saying an application already exists, your earlier application is already with us.",
    },
    {
      question: "How can I stay updated about events and announcements?",
      answer:
        "Follow our Instagram page, join the WhatsApp channel (both buttons are on this page), and subscribe to the newsletter at the bottom of any page.",
    },
    {
      question: "How can I contact the club?",
      answer:
        "Use the Contact page on this website, or email us at rcinnovationclub@gmail.com. We welcome questions from students, faculty, sponsors, and partner organizations.",
    },
  ],
};

/** Defaults + whatever the CMS has under "faqSection". */
export function getFaq(c: Content): FaqSection {
  const db = (c as unknown as { faqSection?: Partial<FaqSection> }).faqSection;
  const items = (Array.isArray(db?.items) ? db!.items : DEFAULT_FAQ.items).filter(
    (i): i is FaqItem => !!i && typeof i.question === "string" && typeof i.answer === "string" && !!i.question.trim() && !!i.answer.trim(),
  );
  return {
    enabled: db?.enabled ?? DEFAULT_FAQ.enabled,
    eyebrow: db?.eyebrow ?? DEFAULT_FAQ.eyebrow,
    title: db?.title ?? DEFAULT_FAQ.title,
    subtitle: db?.subtitle ?? DEFAULT_FAQ.subtitle,
    items,
  };
}