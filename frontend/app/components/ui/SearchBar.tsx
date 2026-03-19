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
      style={{ position: "relative", width: "100%", maxWidth: "400px", marginBottom: "22px" }}
    >
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="neon-search"
      />

      {/* Search Icon */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.6,
        }}
      >
        <Search size={16} />
      </div>

      {/* Clear Button */}
      {value && (
        <button
  onClick={() => onChange("")}
  style={{
    position: "absolute",
    right: "-172px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    display: "flex",
    alignItems: "center",
    color: "var(--neon-blue)",
    opacity: 0.7,
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.opacity = "1";
    e.currentTarget.style.textShadow = "0 0 6px rgba(0,240,255,0.8)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.opacity = "0.7";
    e.currentTarget.style.textShadow = "none";
  }}
>
  <X size={14} />
</button>
      )}
    </div>
  );
}