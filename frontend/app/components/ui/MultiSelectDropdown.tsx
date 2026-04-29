'use client';

import { useEffect, useRef, useState } from 'react';

interface MultiSelectDropdownProps<T> {
  options: T[];
  values: any[];
  onChange: (values: any[]) => void;
  labelKey: keyof T;
  valueKey: keyof T;
  placeholder?: string;
  minWidth?: string;
}

export function MultiSelectDropdown<T>({
  options,
  values,
  onChange,
  labelKey,
  valueKey,
  placeholder = "Select options",
  minWidth = "100%",
}: MultiSelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabels = options
    .filter((opt) => values.includes(opt[valueKey]))
    .map((opt) => String(opt[labelKey]));

  const toggleValue = (val: any) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>

      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid var(--border-glow)",
          background: "rgba(255,255,255,0.03)",
          color: selectedLabels.length ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "46px",
          gap: "8px",
        }}
      >
        {/* Selected tags or placeholder */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
          {selectedLabels.length === 0 ? (
  <span>{placeholder}</span>
) : (
  <span>{selectedLabels.join(", ")}</span>
)}
        </div>

        <span
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--text-primary)",
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            maxHeight: "250px",
            overflowY: "auto",
            borderRadius: "12px",
            background: "rgb(17, 24, 39)",
            border: "1px solid var(--border-glow)",
            zIndex: 9999,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px" }}>
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const optValue = opt[valueKey];
              const optLabel = String(opt[labelKey]);
              const isChecked = values.includes(optValue);

              return (
                <div
                  key={String(optValue)}
                  onClick={() => toggleValue(optValue)}
                  style={{
                    padding: "11px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: isChecked ? "rgba(99,102,241,0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isChecked
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(255,255,255,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isChecked
                      ? "rgba(99,102,241,0.08)"
                      : "transparent")
                  }
                >
                  {/* Custom checkbox */}
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: isChecked ? "1px solid var(--neon-blue)" : "2px solid var(--border-glow)",
                      backgroundColor: isChecked ? "var(--neon-blue)" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {isChecked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                    {optLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}