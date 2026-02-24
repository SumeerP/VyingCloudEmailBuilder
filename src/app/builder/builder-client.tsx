"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import EmailBuilder from "@/components/email-builder";
import EmailListSidebar from "@/components/email-list-sidebar";
import SaveStatusToast, { type SaveStatus } from "@/components/save-status-toast";

interface EmailSummary {
  id: string;
  name: string;
  subject: string;
  status: string;
  updated_at: string;
}

interface BuilderClientProps {
  user: { id: string; email: string };
  orgId: string;
  initialBrand: Record<string, unknown> | null;
  initialBlocks: Array<Record<string, unknown>>;
  initialEmail: Record<string, unknown> | null;
}

export default function BuilderClient({
  user,
  orgId,
  initialBrand,
  initialBlocks,
  initialEmail,
}: BuilderClientProps) {
  const router = useRouter();

  // Email list state
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [showEmailPicker, setShowEmailPicker] = useState(false);

  // Save status for toast
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inject the Supabase storage adapter onto window so the email builder can use it
  useEffect(() => {
    (window as unknown as Record<string, unknown>).storage = storage;
    (window as unknown as Record<string, unknown>).__user = user;
    (window as unknown as Record<string, unknown>).__orgId = orgId;
  }, [user, orgId]);

  // Cmd+S / Ctrl+S keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("email-builder-save", { detail: { explicit: true } }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load email list
  const refreshEmailList = useCallback(async () => {
    try {
      const list = await storage.list("emails");
      setEmails(list);
    } catch (e) {
      console.error("Failed to load email list:", e);
    }
  }, []);

  useEffect(() => {
    refreshEmailList();
  }, [refreshEmailList]);

  // Handle save from email builder
  const handleSave = useCallback(
    async (emailData: Record<string, unknown>, explicit: boolean) => {
      setSaveStatus("saving");
      setSaveError(null);
      try {
        await storage.set("emails:" + emailData.id, JSON.stringify(emailData));

        // Sync URL on first save of a new email
        if (!window.location.search.includes("id=")) {
          window.history.replaceState(null, "", `/builder?id=${emailData.id}`);
        }

        // Create version snapshot on explicit saves (manual save / Cmd+S)
        if (explicit) {
          try {
            await storage.createVersion(
              emailData.id as string,
              emailData.comps,
              emailData.gS,
              emailData.meta
            );
          } catch (vErr) {
            console.error("Version snapshot failed:", vErr);
            // Don't fail the whole save for a version error
          }
        }

        setSaveStatus("saved");
        // Refresh the email list so it reflects the latest save
        refreshEmailList();
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e: unknown) {
        setSaveStatus("error");
        setSaveError(e instanceof Error ? e.message : "Unknown error");
      }
    },
    [refreshEmailList]
  );

  // Handle new email
  const handleNew = useCallback(() => {
    router.push("/builder");
  }, [router]);

  // Handle load email
  const handleLoad = useCallback(
    (emailId: string) => {
      router.push(`/builder?id=${emailId}`);
    },
    [router]
  );

  // Handle delete email
  const handleDelete = useCallback(
    async (emailId: string) => {
      try {
        await storage.delete("emails:" + emailId);
        await refreshEmailList();
        // If the deleted email is the current one, navigate to a fresh builder
        const currentId = (initialEmail as Record<string, unknown> | null)?.id;
        if (currentId === emailId) {
          router.push("/builder");
        }
      } catch (e) {
        console.error("Delete failed:", e);
        setSaveStatus("error");
        setSaveError(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [refreshEmailList, initialEmail, router]
  );

  const currentEmailId = (initialEmail?.id as string) || null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {showEmailPicker && (
        <EmailListSidebar
          emails={emails}
          currentEmailId={currentEmailId}
          onSelect={handleLoad}
          onNew={handleNew}
          onDelete={handleDelete}
          onClose={() => setShowEmailPicker(false)}
        />
      )}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <EmailBuilder
          key={currentEmailId || "new"}
          initialBrand={initialBrand}
          initialBlocks={initialBlocks}
          initialEmail={initialEmail}
          initialEmailId={currentEmailId}
          onSave={handleSave}
          onToggleEmailList={() => setShowEmailPicker((p) => !p)}
        />
      </div>
      <SaveStatusToast status={saveStatus} error={saveError} />
    </div>
  );
}
