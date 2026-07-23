'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const positionMenu = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 250;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      maxHeight: dropdownHeight,
      overflowY: "auto",
      borderRadius: "12px",
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      zIndex: 99999,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      ...(openUpwards
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    positionMenu();
    const handleReposition = () => positionMenu();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const selected = options.find((opt) => opt[valueKey] === value);
  const selectedLabel = selected ? String(selected[labelKey]) : placeholder;
  const canUsePortal = typeof document !== "undefined";

  return (
    <div ref={triggerRef} style={{ position: "relative", minWidth }}>
      {/* Trigger */}
      <div
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) positionMenu();
          setOpen(nextOpen);
        }}
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

      {/* Dropdown menu — rendered into document.body via portal */}
      {open && canUsePortal && createPortal(
        <div ref={menuRef} style={menuStyle}>
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {optionLabel}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}