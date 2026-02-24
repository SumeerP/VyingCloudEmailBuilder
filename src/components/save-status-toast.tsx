"use client";

import { useEffect, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusToastProps {
  status: SaveStatus;
  error?: string | null;
}

export default function SaveStatusToast({ status, error }: SaveStatusToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Auto-hide after "saved" state
    if (status === "saved") {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) return null;

  const configs = {
    saving: {
      bg: "rgba(30,41,59,0.95)",
      border: "#334155",
      text: "#94a3b8",
      icon: "⏳",
      label: "Saving...",
    },
    saved: {
      bg: "rgba(6,95,70,0.95)",
      border: "#065f46",
      text: "#6ee7b7",
      icon: "✓",
      label: "Saved",
    },
    error: {
      bg: "rgba(127,29,29,0.95)",
      border: "#991b1b",
      text: "#fca5a5",
      icon: "✕",
      label: error ? `Save failed: ${error}` : "Save failed",
    },
    idle: { bg: "transparent", border: "transparent", text: "transparent", icon: "", label: "" },
  };

  const c = configs[status];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 300,
        padding: "8px 14px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        color: c.text,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "opacity 0.3s ease",
        maxWidth: 300,
      }}
    >
      <span style={{ fontSize: 13 }}>{c.icon}</span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {c.label}
      </span>
    </div>
  );
}
