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
  const [openUpwards, setOpenUpwards] = useState(false);
  

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
  const handleResize = () => {
    if (open) {
      setOpenUpwards(determineDropdownDirection());
    }
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, [open]);

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

  const determineDropdownDirection = () => {
  if (!ref.current) return false;

  const rect = ref.current.getBoundingClientRect();

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  const dropdownHeight = 250;

  return (
    spaceBelow < dropdownHeight &&
    spaceAbove > spaceBelow
  );
};

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>

      {/* Trigger */}
      <div
        onClick={() => 
        {
          const nextOpen = !open;
          if (nextOpen) {
            setOpenUpwards(determineDropdownDirection());
          }
          setOpen(nextOpen);
        }
        }
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          background: "#ffffff",
          color: selectedLabels.length ? "#111827" : "#6b7280",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "46px",
          gap: "8px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
            borderTop: "6px solid #374151",
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
  <div
    style={{
      position: "absolute",
      left: 0,
      width: "100%",
      maxHeight: "250px",
      overflowY: "auto",
      borderRadius: "12px",
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      zIndex: 9999,
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",

      ...(openUpwards
        ? {
            bottom: "calc(100% + 4px)",
          }
        : {
            top: "calc(100% + 4px)",
          }),
    }}
  >
          {options.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>
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
                    borderBottom: "1px solid #f3f4f6",
                    backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isChecked
                      ? "#dbeafe"
                      : "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isChecked
                      ? "#eff6ff"
                      : "#ffffff")
                  }
                >
                  {/* Custom checkbox */}
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: isChecked ? "1px solid #2563eb" : "2px solid #d1d5db",
                      backgroundColor: isChecked ? "#2563eb" : "#ffffff",
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

                  <span style={{ color: "#111827", fontSize: "14px" }}>
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