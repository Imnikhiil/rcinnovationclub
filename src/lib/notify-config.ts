import type { Content } from "@/lib/content";
import type { NotifyConfig } from "@/lib/types";

export function getNotifyConfig(c: Content): NotifyConfig {
  const n = c.notificationsSection;
  return {
    enabled: n.enabled !== false,
    accessKey: (n.web3formsAccessKey || "").trim(),
    notifyEmail: n.notifyEmail || c.social.email,
    onContact: n.notifyOnContact !== false,
    onMembership: n.notifyOnMembership !== false,
    contactSubject: n.contactSubject,
    membershipSubject: n.membershipSubject,
  };
}