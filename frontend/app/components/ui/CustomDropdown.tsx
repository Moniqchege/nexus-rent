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
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          fontSize: "13px",
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
            borderTop: "6px solid #6b7280",
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
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            zIndex: 9999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
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
                  color: "#111827",
                  fontSize: "14px",
                  borderBottom: "1px solid #f3f4f6"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8fafc")
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