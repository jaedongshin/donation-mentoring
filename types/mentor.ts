export interface Mentor {
  id: string;
  name_en: string | null;
  name_ko: string | null;
  description_en: string | null;
  description_ko: string | null;
  location_en: string | null;
  location_ko: string | null;
  position_en: string | null;
  position_ko: string | null;
  company_en: string | null;
  company_ko: string | null;
  picture_url: string | null;
  linkedin_url: string | null;
  calendly_url: string | null;
  email: string | null;
  languages: string[] | null;
  tags: string[] | null;
  is_active: boolean;
  session_time_minutes: number | null;
  session_price_usd: number | null;
  created_at: string;
}
