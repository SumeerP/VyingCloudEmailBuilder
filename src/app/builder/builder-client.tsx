"use client";

import { useEffect } from "react";
import { storage } from "@/lib/storage";
import EmailBuilder from "@/components/email-builder";

interface BuilderClientProps {
  user: { id: string; email: string };
  orgId: string;
  initialBrand: Record<string, unknown> | null;
  initialBlocks: Array<Record<string, unknown>>;
}

export default function BuilderClient({
  user,
  orgId,
  initialBrand,
  initialBlocks,
}: BuilderClientProps) {
  // Inject the Supabase storage adapter onto window so the email builder can use it
  useEffect(() => {
    (window as unknown as Record<string, unknown>).storage = storage;
    (window as unknown as Record<string, unknown>).__user = user;
    (window as unknown as Record<string, unknown>).__orgId = orgId;
  }, [user, orgId]);

  return (
    <EmailBuilder
      initialBrand={initialBrand}
      initialBlocks={initialBlocks}
    />
  );
}
