"use client";

import { useState } from "react";

interface EmailSummary {
  id: string;
  name: string;
  subject: string;
  status: string;
  updated_at: string;
}

interface EmailListSidebarProps {
  emails: EmailSummary[];
  currentEmailId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PB = "#0f172a";
const BD = "#1e293b";
const BG = "#020617";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
  review: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  approved: { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7" },
  sent: { bg: "rgba(14,165,233,0.15)", text: "#7dd3fc" },
};

export default function EmailListSidebar({
  emails,
  currentEmailId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: EmailListSidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        width: 280,
        background: PB,
        borderRight: `1px solid ${BD}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${BD}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", flex: 1 }}>
          📁 My Emails
        </span>
        <button
          onClick={onNew}
          style={{
            padding: "4px 10px",
            background: "#065f46",
            border: "none",
            borderRadius: 4,
            color: "#6ee7b7",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          + New
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 4px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Email list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {emails.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "#475569",
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            No emails yet.
            <br />
            Click &quot;+ New&quot; to get started.
          </div>
        )}
        {emails.map((email) => {
          const isCurrent = email.id === currentEmailId;
          const isHovered = email.id === hoveredId;
          const sc = statusColors[email.status] || statusColors.draft;

          return (
            <div
              key={email.id}
              onClick={() => onSelect(email.id)}
              onMouseEnter={() => setHoveredId(email.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                if (confirmDelete === email.id) setConfirmDelete(null);
              }}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${BD}`,
                cursor: "pointer",
                background: isCurrent
                  ? "rgba(14,165,233,0.08)"
                  : isHovered
                  ? "rgba(255,255,255,0.03)"
                  : "transparent",
                borderLeft: isCurrent ? "2px solid #0ea5e9" : "2px solid transparent",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isCurrent ? "#7dd3fc" : "#e2e8f0",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {email.name}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    padding: "2px 5px",
                    borderRadius: 3,
                    background: sc.bg,
                    color: sc.text,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    flexShrink: 0,
                  }}
                >
                  {email.status}
                </span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 2,
                }}
              >
                {email.subject || "No subject"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 9, color: "#475569" }}>
                  {timeAgo(email.updated_at)}
                </span>
                {/* Delete button — visible on hover */}
                {isHovered && (
                  <>
                    {confirmDelete === email.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(email.id);
                          setConfirmDelete(null);
                        }}
                        style={{
                          padding: "2px 8px",
                          background: "#7f1d1d",
                          border: "none",
                          borderRadius: 3,
                          color: "#fca5a5",
                          cursor: "pointer",
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      >
                        Confirm delete?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(email.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          fontSize: 11,
                          padding: "0 2px",
                        }}
                        title="Delete email"
                      >
                        🗑
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: `1px solid ${BD}`,
          fontSize: 9,
          color: "#475569",
          textAlign: "center",
          background: BG,
        }}
      >
        {emails.length} email{emails.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
