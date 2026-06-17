"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MonthPickerPopupProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthPickerPopup({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select month",
}: MonthPickerPopupProps) {
  const today = new Date();

  // value format => "2026-05"
  const [selected, setSelected] = useState<{
    month: number;
    year: number;
  } | null>(() => {
    if (!value) return null;

    const [year, month] = value.split("-").map(Number);

    return {
      year,
      month: month - 1,
    };
  });

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selected?.year ?? today.getFullYear()
  );

  const [popupStyle, setPopupStyle] =
    useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handler);

    return () => {
      document.removeEventListener("click", handler);
    };
  }, []);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    const [year, month] = value.split("-").map(Number);

    setSelected({
      year,
      month: month - 1,
    });

    setViewYear(year);
  }, [value]);

  const selectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const formatted = `${viewYear}-${mm}`;

    setSelected({
      month: monthIndex,
      year: viewYear,
    });

    onChange(formatted);
    setOpen(false);
  };

  const isSelected = (monthIndex: number) =>
    selected?.month === monthIndex &&
    selected?.year === viewYear;

  const isCurrentMonth = (monthIndex: number) =>
    today.getMonth() === monthIndex &&
    today.getFullYear() === viewYear;

  const displayValue = selected
    ? `${MONTHS[selected.month]} ${selected.year}`
    : null;

  const popup = (
    <div
      ref={popupRef}
      style={{
        ...styles.popup,
        ...popupStyle,
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <button
          type="button"
          onClick={() => setViewYear((y) => y - 1)}
          style={styles.navBtn}
        >
          &#8249;
        </button>

        <span style={styles.yearLabel}>
          {viewYear}
        </span>

        <button
          type="button"
          onClick={() => setViewYear((y) => y + 1)}
          style={styles.navBtn}
        >
          &#8250;
        </button>
      </div>

      {/* Months */}
      <div style={styles.monthGrid}>
        {MONTHS.map((month, index) => {
          const selectedMonth = isSelected(index);
          const currentMonth = isCurrentMonth(index);

          return (
            <div
              key={month}
              onClick={() => selectMonth(index)}
              style={{
                ...styles.monthCell,
                background: selectedMonth
                   ? "#dbeafe" 
                   : currentMonth
                   ? "#eef2ff" 
                   : "#f8fafc",
                border: selectedMonth
                  ? "1px solid #93c5fd"
                  : "1px solid #e2e8f0",
                color: selectedMonth
                  ? "#1d4ed8"
                  : currentMonth
                  ? "#4f46e5"
                  : "#334155",
                fontWeight:
                  selectedMonth || currentMonth
                    ? 700
                    : 500,
                boxShadow: selectedMonth
                  ? "0 6px 18px rgba(59, 130, 246, 0.15)"
                  : "none",
              }}
            >
              {month.slice(0, 3)}

              {currentMonth && !selectedMonth && (
                <span style={styles.todayDot} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      {/* Label */}
      {label && (
        <label style={styles.label}>
          {label} {required && "*"}
        </label>
      )}

      {/* Trigger */}
     <div
  ref={triggerRef}
  onClick={() => {
    if (!open && triggerRef.current) {
      const rect =
        triggerRef.current.getBoundingClientRect();

      const POPUP_HEIGHT = 290;

      const spaceBelow =
        window.innerHeight - rect.bottom;

      const above =
        spaceBelow < POPUP_HEIGHT;

      setPopupStyle({
        position: "fixed",
        left: rect.left + window.scrollX,

        ...(above
          ? {
              bottom:
                window.innerHeight -
                rect.top +
                8,
              top: "auto",
            }
          : {
              top: rect.bottom + 8,
              bottom: "auto",
            }),
      });
    }

    setOpen((o) => !o);
  }}
  style={{
    ...styles.trigger,
    borderColor: open
      ? "rgba(59,130,246,0.7)"
      : displayValue
      ? "rgba(82, 81, 84, 0.5)"
      : "var(--border-glow, rgba(59,130,246,0.3))",

    boxShadow: open
      ? "0 0 0 3px rgba(59,130,246,0.08)"
      : "none",
  }}
>
  {/* LEFT */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      minWidth: 0,
    }}
  >

    {displayValue ? (
      <span style={styles.valueText}>
        {displayValue}
      </span>
    ) : (
      <span style={styles.placeholder}>
        {placeholder}
      </span>
    )}
  </div>

  {/* RIGHT ICON */}
   <AgendaIcon open={open} />
</div>

      {/* Popup */}
      {open && createPortal(popup, document.body)}
    </div>
  );
}

function AgendaIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transition: "all 0.2s ease",
        opacity: open ? 0.7 : 1,
      }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
      <path d="M10 2v4" />
      <path d="M14 2v4" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "8px",
    color: "#475569", // slate-600
  },

  trigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",

    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "13px 18px",

    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",

    color: "#0f172a", // slate-900
    fontSize: "14px",
    userSelect: "none",
  },

  placeholder: {
    color: "#94a3b8",
    fontSize: "14px",
  },

  valueText: {
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: 600,
  },

  popup: {
    zIndex: 99999,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "15px",
    width: "272px",

    backdropFilter: "blur(12px)",
    boxShadow:
      "0 20px 40px rgba(15, 23, 42, 0.08)",

    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "10px",

    border: "1px solid #e2e8f0",
    background: "#f8fafc",

    color: "#475569",
    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  yearLabel: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1d4ed8", // subtle primary blue
  },

  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },

  monthCell: {
    position: "relative",
    height: "40px",
    borderRadius: "14px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "13px",
    cursor: "pointer",
    userSelect: "none",

    transition: "all 0.18s ease",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
  },

  todayDot: {
    position: "absolute",
    bottom: "7px",
    left: "50%",
    transform: "translateX(-50%)",

    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#6366f1", // indigo accent
  },
};