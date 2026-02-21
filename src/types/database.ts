export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  org_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  org_id: string;
  name: string;
  subject: string;
  preheader: string | null;
  from_name: string | null;
  from_email: string | null;
  components: Record<string, unknown>[];
  global_styles: Record<string, unknown>;
  ab_enabled: boolean;
  ab_config: Record<string, unknown> | null;
  status: "draft" | "review" | "approved" | "sent";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmailVersion {
  id: string;
  email_id: string;
  version_number: number;
  components: Record<string, unknown>[];
  global_styles: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_by: string;
  created_at: string;
  comment: string | null;
}

export interface ContentBlock {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  components: Record<string, unknown>[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  org_id: string;
  name: string;
  config: Record<string, unknown>;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
