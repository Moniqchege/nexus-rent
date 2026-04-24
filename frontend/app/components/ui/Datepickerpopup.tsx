"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerPopupProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEKDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function DatePickerPopup({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select date",
}: DatePickerPopupProps) {
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;

  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number, month: number, year: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { day: number; month: number; year: number; type: "prev" | "current" | "next" }[] = [];

  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrev - firstDay + 1 + i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, month: m, year: y, type: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, type: "current" });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: i, month: m, year: y, type: "next" });
  }

  const isSelected = (day: number, month: number, year: number) =>
    parsed?.getFullYear() === year &&
    parsed?.getMonth() === month &&
    parsed?.getDate() === day;

  const isToday = (day: number, month: number, year: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const displayValue = parsed
    ? `${MONTHS[parsed.getMonth()].slice(0, 3)} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : null;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
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
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const POPUP_HEIGHT = 340; // approx height of the calendar popup
            setOpenUpward(spaceBelow < POPUP_HEIGHT);
          }
          setOpen(o => !o);
        }}
        style={{
          ...styles.trigger,
          borderColor: open
            ? "rgba(59,130,246,0.7)"
            : displayValue
            ? "rgba(139,92,246,0.5)"
            : "var(--border-glow, rgba(59,130,246,0.3))",
          boxShadow: open ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
        }}
      >
        <CalendarIcon />
        {displayValue ? (
          <span style={styles.valueText}>{displayValue}</span>
        ) : (
          <span style={styles.placeholder}>{placeholder}</span>
        )}
      </div>

      {/* Popup */}
      {open && (
        <div style={{
          ...styles.popup,
          ...(openUpward
            ? { top: "auto", bottom: "100%"}
            : { top: "calc(100% + 8px)", bottom: "auto" }),
        }}>
          {/* Header */}
          <div style={styles.header}>
            <button type="button" onClick={prevMonth} style={styles.navBtn}>&#8249;</button>
            <span style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={styles.navBtn}>&#8250;</button>
          </div>

          {/* Weekdays */}
          <div style={styles.weekdayGrid}>
            {WEEKDAYS.map(d => (
              <div key={d} style={styles.weekday}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={styles.daysGrid}>
            {cells.map(({ day, month, year, type }, i) => {
              const sel = isSelected(day, month, year);
              const tod = isToday(day, month, year);
              const faded = type !== "current";

              return (
                <div
                  key={i}
                  onClick={() => !faded && selectDay(day, month, year)}
                  style={{
                    ...styles.dayCell,
                    opacity: faded ? 0.2 : 1,
                    cursor: faded ? "default" : "pointer",
                    background: sel
                      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                      : tod
                      ? "rgba(139,92,246,0.15)"
                      : undefined,
                    color: sel ? "#fff" : tod ? "#8b5cf6" : "var(--text-primary, #f1f5f9)",
                    fontWeight: sel || tod ? 700 : 400,
                    boxShadow: sel ? "0 2px 12px rgba(139,92,246,0.4)" : "none",
                  }}
                >
                  {day}
                  {tod && !sel && (
                    <span style={styles.todayDot} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16" height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{ flexShrink: 0, opacity: 0.6 }}
    >
      <rect x="1" y="3" width="14" height="12" rx="2.5" />
      <line x1="1" y1="7" x2="15" y2="7" />
      <line x1="5" y1="1" x2="5" y2="5" />
      <line x1="11" y1="1" x2="11" y2="5" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "8px",
    color: "var(--neon-blue)",
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    backgroundColor: "rgba(17,24,39,0.5)",
    border: "1px solid",
    borderRadius: "12px",
    padding: "13px 18px",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
    color: "var(--text-primary, #f1f5f9)",
    fontSize: "14px",
    userSelect: "none",
  },
  placeholder: {
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "14px",
  },
  valueText: {
    fontSize: "14px",
    background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: 600,
  },
  popup: {
    position: "absolute",
    left: 0,
    zIndex: 99999,
    background: "rgba(11,17,32,0.98)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: "20px",
    padding: "15px",
    width: "272px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.06) inset",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(17,24,39,0.5)",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    lineHeight: 1,
    transition: "border-color 0.15s, color 0.15s",
  },
  monthLabel: {
    fontSize: "13px",
    fontWeight: 700,
    background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  weekdayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  weekday: {
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#64748b",
    paddingBottom: "4px",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "3px",
  },
  dayCell: {
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    fontSize: "12px",
    position: "relative",
    transition: "background 0.15s, color 0.15s",
  },
  todayDot: {
    position: "absolute",
    bottom: "3px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "3px",
    height: "3px",
    borderRadius: "50%",
    background: "#8b5cf6",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(59,130,246,0.2)",
    paddingTop: "10px",
  },
  todayBtn: {
    fontSize: "12px",
    color: "#3b82f6",
    cursor: "pointer",
    background: "none",
    border: "none",
    fontWeight: 600,
    padding: 0,
  },
  clearBtn: {
    fontSize: "12px",
    color: "#64748b",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    transition: "color 0.15s",
  },
};