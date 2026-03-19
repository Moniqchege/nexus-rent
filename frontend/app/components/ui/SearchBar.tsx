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
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.6,
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}