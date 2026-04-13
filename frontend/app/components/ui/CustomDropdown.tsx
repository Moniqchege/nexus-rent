'use client';

import { useEffect, useRef, useState } from 'react';

interface DropdownProps<T> {
  options: T[];
  value: any;
  onChange: (value: any) => void;
  labelKey: keyof T;
  valueKey: keyof T;
  placeholder?: string;
  minWidth?: string;
}

export function CustomDropdown<T>({
  options,
  value,
  onChange,
  labelKey,
  valueKey,
  placeholder = "Select option",
  minWidth = "100%",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(
    (opt) => opt[valueKey] === value
  );

  const selectedLabel = selected
    ? String(selected[labelKey])
    : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>
      
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid var(--border-glow)",
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-primary)",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {selectedLabel}

        <span
          style={{
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
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          {options.map((opt) => {
            const optionValue = opt[valueKey];
            const optionLabel = String(opt[labelKey]);

            return (
              <div
                key={String(optionValue)}
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {optionLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}