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
      const { data, error } = await supabase
        .from("brand_kits")
        .select("config")
        .eq("org_id", orgId)
        .eq("is_default", true)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      if (data) return { value: JSON.stringify(data.config) };
      return null;
    }

    // Content blocks
    if (key === "content_blocks" && global) {
      const { data, error } = await supabase
        .from("content_blocks")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("id", emailId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
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
        const { error } = await supabase
          .from("brand_kits")
          .update({ config })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_kits").insert({
          org_id: orgId,
          name: "Default Brand",
          config,
          is_default: true,
          created_by: userId,
        });
        if (error) throw error;
      }
      return;
    }

    // Content blocks — full sync (upsert + delete removed)
    if (key === "content_blocks" && global) {
      const blocks = JSON.parse(value);
      const incomingIds = blocks.map((b: { id: string }) => b.id);

      // Upsert each block (insert or update)
      for (const block of blocks) {
        const blockData = {
          name: block.name,
          description: block.desc || null,
          category: block.cat || "Content",
          tags: block.tags || [],
          components: block.comps || [],
        };

        const { data: existing } = await supabase
          .from("content_blocks")
          .select("id")
          .eq("id", block.id)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("content_blocks")
            .update(blockData)
            .eq("id", block.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("content_blocks").insert({
            id: block.id,
            org_id: orgId,
            created_by: userId,
            ...blockData,
          });
          if (error) throw error;
        }
      }

      // Delete blocks that were removed locally
      const { data: dbBlocks } = await supabase
        .from("content_blocks")
        .select("id")
        .eq("org_id", orgId);
      if (dbBlocks) {
        const toDelete = dbBlocks
          .filter((db) => !incomingIds.includes(db.id))
          .map((db) => db.id);
        if (toDelete.length > 0) {
          const { error } = await supabase
            .from("content_blocks")
            .delete()
            .in("id", toDelete);
          if (error) throw error;
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
        const { error } = await supabase
          .from("emails")
          .update(emailData)
          .eq("id", emailId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("emails").insert({
          id: emailId,
          org_id: orgId,
          created_by: userId,
          ...emailData,
        });
        if (error) throw error;
      }
      return;
    }
  },

  /**
   * List emails for the current user's org.
   * Returns lightweight summaries sorted by most recently updated.
   */
  async list(prefix: string): Promise<Array<{ id: string; name: string; subject: string; status: string; updated_at: string }>> {
    if (prefix !== "emails") return [];
    const orgId = await getUserOrgId();
    const { data, error } = await supabase
      .from("emails")
      .select("id, name, subject, status, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  /**
   * Delete an email by key ("emails:{id}").
   */
  async delete(key: string): Promise<void> {
    if (!key.startsWith("emails:")) return;
    const emailId = key.replace("emails:", "");
    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", emailId);
    if (error) throw error;
  },

  /**
   * Create a version snapshot in email_versions.
   * Called on explicit saves (manual save button or Cmd+S).
   */
  async createVersion(
    emailId: string,
    components: unknown,
    globalStyles: unknown,
    meta: unknown
  ): Promise<void> {
    const userId = await getUserId();

    // Get the current max version_number for this email
    const { data: latest } = await supabase
      .from("email_versions")
      .select("version_number")
      .eq("email_id", emailId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latest?.version_number || 0) + 1;

    const { error } = await supabase
      .from("email_versions")
      .insert({
        email_id: emailId,
        version_number: nextVersion,
        components: components,
        global_styles: globalStyles,
        meta: meta,
        created_by: userId,
      });
    if (error) throw error;
  },
};
