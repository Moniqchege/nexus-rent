"use client";

import { AMENITY_OPTIONS, PROPERTY_STATUS_OPTIONS } from "@/app/lib/utils";
import { useAdminStore } from "@/app/store/adminStore";
import React, { useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface AmenitiesDropdownProps {
  options: Option[];
  value: string[];
  onChange: (val: string[]) => void;
}

interface PropertyApi {
  id?: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  amenities?: string[];
  image?: string;
  createdAt?: string;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyApi>;
  onSuccess?: (data: Partial<PropertyApi>) => void | Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
  onCancel: () => void;
}

function AmenitiesDropdown({
  options,
  value = [],
  onChange,
}: AmenitiesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtered options for autocomplete
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate whether dropdown should open up or down
  useEffect(() => {
    if (open && ref.current && dropdownRef.current) {
      const rect = ref.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (dropdownHeight > spaceBelow && spaceAbove > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [open, filteredOptions]); // recalc whenever filteredOptions changes

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          backgroundColor: "rgba(17,24,39,0.5)",
          border: "1px solid var(--border-glow)",
          borderRadius: "12px",
          padding: "14px 20px",
          cursor: "pointer",
          color: value.length ? "var(--text-primary)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "14px",
        }}
      >
        <span>
          {value.length > 0
            ? options
                .filter((opt) => value.includes(opt.value))
                .map((opt) => opt.label)
                .join(", ")
            : "Select amenities"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--text-primary)",
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#111827",
            border: "1px solid var(--border-glow)",
            borderRadius: "12px",
            padding: "10px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            top: dropUp ? "auto" : "calc(100% + 4px)",
            bottom: dropUp ? "calc(100% + 4px)" : "auto",
          }}
        >
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: "8px",
              borderRadius: "8px",
              border: "1px solid var(--border-glow)",
              backgroundColor: "#1f2937",
              color: "white",
            }}
          />
          {filteredOptions.map((option) => (
            <label
              key={option.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 2px",
                fontSize: "14px",
                cursor: "pointer",
                color: "white",
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
              />
              {option.label}
            </label>
          ))}
          {filteredOptions.length === 0 && <p style={{ color: "#888", padding: "6px" }}>No results</p>}
        </div>
      )}
    </div>
  );
}

export default function PropertyForm({
  initialData = {},
  onSuccess,
  onCancel,
  isEdit = false,
  submitLabel = "Create Property",
}: PropertyFormProps) {
  const [data, setData] = useState<Partial<PropertyApi>>(() => ({
  ...initialData,
  amenities: initialData.amenities ?? [],
}));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { amenities, fetchAmenities } = useAdminStore();

    useEffect(() => {
  fetchAmenities();
}, []);

const formatLabel = (label: string) =>
  label
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const amenityOptions: Option[] = amenities.map(a => ({
  label: formatLabel(a.label),
  value: a.key,
}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSuccess) return;

    setError(null);
    setLoading(true);

    try {
      await onSuccess(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(17,24,39,0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border-glow)",
        borderRadius: "24px",
        padding: "25px",
        maxWidth: "950px",
        margin: "0 auto",
        marginBottom: "42px",
      }}
    >
      <h3
        style={{
        fontSize: "20px", 
        fontWeight: 700, 
        background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "14px",
        }}
      >
        {isEdit ? "Edit Property" : "Create Property"}
      </h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        {/* Title + Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Title *
          </label>
            <input
            type="text"
            placeholder="Enter Apartment's Title"
            value={data.title || ""}
            onChange={(e) => setData({ ...data, title: e.target.value })}
             style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
          </div>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Location *
          </label>
           <input
            type="text"
            placeholder="Location"
            value={data.location || ""}
            onChange={(e) => setData({ ...data, location: e.target.value })}
             style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
        </div>
        </div>

        {/* Price + Beds */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Price(Ksh /Month) *
          </label>
           <input
            type="number"
            placeholder="Price (KES)"
            value={data.price || ""}
            onChange={(e) =>
              setData({ ...data, price: parseFloat(e.target.value) || 0 })
            }
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Bedrooms *
          </label>
           <input
            type="number"
            placeholder="Beds"
            value={data.beds || ""}
            onChange={(e) =>
              setData({ ...data, beds: parseInt(e.target.value) || 0 })
            }
             style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
          </div>
        </div>

        {/* Baths + Sqft */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Baths *
          </label>
            <input
            type="number"
            placeholder="Baths"
            value={data.baths || ""}
            onChange={(e) =>
              setData({ ...data, baths: parseInt(e.target.value) || 0 })
            }
             style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Sqft *
          </label>
           <input
            type="number"
            placeholder="Sqft"
            value={data.sqft || ""}
            onChange={(e) =>
              setData({ ...data, sqft: parseInt(e.target.value) || 0 })
            }
             style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
            }}
            required
          />
          </div>
        </div>

        {/* Status + Amenities */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Status *
          </label>
          <select
          value={data.status || "available"}
          onChange={(e) => setData({ ...data, status: e.target.value })}
          style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14px",
              color: "var(--text-primary)"
          }}
          required
          >
          <option value="">Select status</option>
          {PROPERTY_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
          {option.label}
          </option>
          ))}
          </select>
          </div>

<div>
  <label
    style={{
      display: "block",
      fontWeight: 600,
      fontSize: "14px",
      marginBottom: "8px",
      color: "var(--neon-blue)",
    }}
  >
    Amenities *
  </label>
 <AmenitiesDropdown
  options={amenityOptions}
  value={data.amenities || []}
  onChange={(val) => setData({ ...data, amenities: val })}
/>
</div>
 </div>

        {/* Image */}
        <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Image *
          </label>
        <input
          type="file"
          accept="image/*"
          placeholder="Image URL"
          onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Optionally generate a preview URL
      const previewURL = URL.createObjectURL(file);
      setData({ ...data, image: previewURL });
    }
  }}
          style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
        />

{/* Preview */}
{data.image && (
  <div style={{ marginTop: "10px" }}>
    <img
      src={data.image}
      alt="Preview"
      style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "12px" }}
    />
  </div>
)}
        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button 
          type="button" 
          onClick={onCancel}
          style={{
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button 
          type="submit" 
          disabled={loading}
          style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}