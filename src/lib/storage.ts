import { createClient } from "@/lib/supabase/client";

/**
 * Supabase-backed storage that replaces the original window.storage interface.
 * Injected into the email builder component so it works with Supabase instead of
 * browser-local storage.
 */

const supabase = createClient();

async function getUserOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!data) throw new Error("No user profile found");
  return data.org_id;
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export const storage = {
  /**
   * Get a value. The `global` flag was used in the original code to distinguish
   * org-wide settings (brand_kit, content_blocks) from per-email data.
   */
  async get(key: string, global?: boolean): Promise<{ value: string } | null> {
    const orgId = await getUserOrgId();

    // Brand kit
    if (key === "brand_kit" && global) {
      const { data } = await supabase
        .from("brand_kits")
        .select("config")
        .eq("org_id", orgId)
        .eq("is_default", true)
        .single();
      if (data) return { value: JSON.stringify(data.config) };
      return null;
    }

    // Content blocks
    if (key === "content_blocks" && global) {
      const { data } = await supabase
        .from("content_blocks")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (data) {
        const blocks = data.map((b) => ({
          id: b.id,
          name: b.name,
          desc: b.description,
          cat: b.category,
          tags: b.tags,
          comps: b.components,
          createdAt: b.created_at,
        }));
        return { value: JSON.stringify(blocks) };
      }
      return null;
    }

    // Per-email data
    if (key.startsWith("emails:")) {
      const emailId = key.replace("emails:", "");
      const { data } = await supabase
        .from("emails")
        .select("*")
        .eq("id", emailId)
        .single();
      if (data) {
        return {
          value: JSON.stringify({
            id: data.id,
            meta: {
              name: data.name,
              subject: data.subject,
              preheader: data.preheader,
              fromName: data.from_name,
              fromEmail: data.from_email,
            },
            comps: data.components,
            gS: data.global_styles,
            abOn: data.ab_enabled,
            abCfg: data.ab_config,
            at: data.updated_at,
          }),
        };
      }
      return null;
    }

    return null;
  },

  /**
   * Set a value. Routes to the appropriate Supabase table.
   */
  async set(key: string, value: string, global?: boolean): Promise<void> {
    const orgId = await getUserOrgId();
    const userId = await getUserId();

    // Brand kit
    if (key === "brand_kit" && global) {
      const config = JSON.parse(value);
      const { data: existing } = await supabase
        .from("brand_kits")
        .select("id")
        .eq("org_id", orgId)
        .eq("is_default", true)
        .single();

      if (existing) {
        await supabase
          .from("brand_kits")
          .update({ config })
          .eq("id", existing.id);
      } else {
        await supabase.from("brand_kits").insert({
          org_id: orgId,
          name: "Default Brand",
          config,
          is_default: true,
          created_by: userId,
        });
      }
      return;
    }

    // Content blocks — bulk replace
    if (key === "content_blocks" && global) {
      const blocks = JSON.parse(value);
      // For individual block operations, we handle add/delete separately
      // This bulk path syncs the full list
      for (const block of blocks) {
        const existing = await supabase
          .from("content_blocks")
          .select("id")
          .eq("id", block.id)
          .single();

        if (!existing.data) {
          await supabase.from("content_blocks").insert({
            id: block.id,
            org_id: orgId,
            name: block.name,
            description: block.desc || null,
            category: block.cat || "Content",
            tags: block.tags || [],
            components: block.comps || [],
            created_by: userId,
          });
        }
      }
      return;
    }

    // Per-email save
    if (key.startsWith("emails:")) {
      const parsed = JSON.parse(value);
      const emailId = key.replace("emails:", "");

      const { data: existing } = await supabase
        .from("emails")
        .select("id")
        .eq("id", emailId)
        .single();

      const emailData = {
        name: parsed.meta?.name || "Untitled Email",
        subject: parsed.meta?.subject || "",
        preheader: parsed.meta?.preheader || null,
        from_name: parsed.meta?.fromName || null,
        from_email: parsed.meta?.fromEmail || null,
        components: parsed.comps || [],
        global_styles: parsed.gS || {},
        ab_enabled: parsed.abOn || false,
        ab_config: parsed.abCfg || null,
        updated_by: userId,
      };

      if (existing) {
        await supabase
          .from("emails")
          .update(emailData)
          .eq("id", emailId);
      } else {
        await supabase.from("emails").insert({
          id: emailId,
          org_id: orgId,
          created_by: userId,
          ...emailData,
        });
      }
      return;
    }
  },
};
