'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface DropdownProps<T> {
  options: T[];
  value: any;
  onChange: (value: any) => void;
  labelKey: keyof T;
  valueKey: keyof T;
  placeholder?: string;
  minWidth?: string;
}

export function PaginationCustomDropdown<T>({
  options,
  value,
  onChange,
  labelKey,
  valueKey,
  placeholder = "Select option",
  minWidth = "100%",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedDropdownHeight = Math.min(
      options.length * 45,
      250
    );

    setOpenUpward(spaceBelow < estimatedDropdownHeight + 20);
  }, [open, options.length]);

  const selected = options.find(
    (opt) => opt[valueKey] === value
  );

  const selectedLabel = selected
    ? String(selected[labelKey])
    : placeholder;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        minWidth,
      }}
    >
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 10px",
          borderRadius: "12px",
          border: "1px solid var(--border-glow)",
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-primary)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",

          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{selectedLabel}</span>

        <span
          style={{
            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",

            transition: "transform 0.2s",

            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid var(--text-primary)",

            flexShrink: 0,
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",

            ...(openUpward
              ? {
                  bottom: "calc(100% + 4px)",
                }
              : {
                  top: "calc(100% + 4px)",
                }),

            left: 0,
            width: "100%",

            maxHeight: "250px",
            overflowY: "auto",

            borderRadius: "12px",
            background: "rgb(17, 24, 39)",
            border: "1px solid var(--border-glow)",

            zIndex: 9999,

            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
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
                  padding: "10px 12px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "transparent")
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