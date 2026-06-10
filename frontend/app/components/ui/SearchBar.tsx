"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
      }}
    >
      <Search
        size={16}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="neon-search"
        style={{ paddingLeft: 36, paddingRight: value ? 36 : 14, marginBottom: 0 }}
      />

      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            background: "var(--bg-muted)",
            border: "1px solid var(--border-glow)",
            borderRadius: 999,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--neon-blue)";
            e.currentTarget.style.borderColor = "var(--neon-blue)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.borderColor = "var(--border-glow)";
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
