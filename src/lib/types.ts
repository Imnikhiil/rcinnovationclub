export interface EventItem {
  id?: string;
  tag?: string;
  title: string;
  date?: string;
  eventDate?: string;
  venue?: string;
  time?: string;
  description?: string;
  image?: string;
  registerUrl?: string;
  registerLabel?: string;
  forceStatus?: "upcoming" | "past" | "auto" | string;
}

export interface GalleryItem {
  id?: string;
  type?: "image" | "video" | string;
  title?: string;
  category?: string;
  eventDate?: string;
  description?: string;
  src?: string;
  image?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
  order?: number;
}

export interface StatItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon?: string;
  description?: string;
  accent?: string;
}

export interface FacultyItem {
  name: string;
  designation?: string;
  role?: string;
  period?: string;
  description?: string;
  image?: string;
}

export interface TeamProfile {
  campus?: string;
  tagline?: string;
  introduction?: string;
  responsibilities?: string[];
  skills?: string[];
  links?: Record<string, string>;
}

export interface TeamMember {
  name: string;
  role: string;
  img?: string;
  accent?: string;
  lead?: boolean;
  department?: string;
  profile?: TeamProfile;
}

export interface AmbassadorItem {
  label: string;
  name: string;
  period?: string;
  description?: string;
  image?: string;
}

export interface MemberName {
  name: string;
  role?: string;
}

export interface LegacyItem {
  year: string;
  title: string;
  description?: string;
}

export interface TestimonialItem {
  name: string;
  role?: string;
  quote: string;
  image?: string;
  rating?: number;
}

export interface PartnerItem {
  name: string;
  type?: "sponsor" | "partner" | "collaborator" | string;
  logo?: string;
  url?: string;
  description?: string;
}

export interface ProjectItem {
  title: string;
  description?: string;
  image?: string;
  tech?: string | string[];
  status?: "completed" | "in-progress" | "planned" | string;
  category?: string;
  githubUrl?: string;
  demoUrl?: string;
  team?: string;
}

export interface ResourceItem {
  title: string;
  description?: string;
  category?: string;
  type?: "pdf" | "link" | "video" | "slides" | "doc" | string;
  url?: string;
  icon?: string;
  tags?: string;
}

export interface RegistrationConfig {
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  upcomingMessage?: string;
  expiredMessage?: string;
  closedMessage?: string;
  disabledMessage?: string;
  successMessage?: string;
}

export interface NotifyConfig {
  enabled: boolean;
  accessKey: string;
  notifyEmail: string;
  onContact: boolean;
  onMembership: boolean;
  contactSubject: string;
  membershipSubject: string;
}

export interface CertificateRow {
  id: string;
  recipient_name: string;
  type: string;
  event_title: string;
  description?: string;
  issue_date: string;
  status: "active" | "revoked" | string;
}