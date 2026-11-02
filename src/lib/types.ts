export interface EventItem {
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
  forceStatus?: "upcoming" | "past" | string;
}

export interface GalleryItem {
  id?: string;
  type?: "image" | "video" | string;
  title?: string;
  category?: string;
  src?: string;
  image?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
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