import type { RegistrationConfig } from "@/lib/types";

export type RegistrationStatus = "open" | "upcoming" | "closed" | "disabled";

/** Same rule as the Join page: enabled + today is inside [startDate, endDate]. Call in the browser. */
export function getRegistrationStatus(cfg: RegistrationConfig): RegistrationStatus {
  if (!cfg.enabled) return "disabled";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (cfg.startDate && today < new Date(cfg.startDate + "T00:00:00")) return "upcoming";
  if (cfg.endDate && now > new Date(cfg.endDate + "T23:59:59")) return "closed";
  return "open";
}