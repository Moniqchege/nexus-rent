"use client";

import { PROPERTY_STATUS_OPTIONS } from "@/app/lib/utils";
import { useAdminStore } from "@/app/store/adminStore";
import React, { useEffect, useRef, useState } from "react";
import { CustomDropdown } from "../ui/CustomDropdown";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";

interface Option {
  label: string;
  value: string;
}

interface PropertyApi {
  id?: number;
  title: string;
  location: string;
  floor: string;
  price: number;
  beds: number;
  baths: number;
  sqft?: number;
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
  const checkScreen = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkScreen();

  window.addEventListener("resize", checkScreen);

  return () => window.removeEventListener("resize", checkScreen);
}, []);

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

useEffect(() => {
  if (initialData.amenities && amenities.length > 0) {
    setData(prev => {
      // Don't overwrite if already set
      if (prev.amenities && prev.amenities.length > 0) return prev;

      const normalizedAmenities = initialData.amenities!.map(a =>
        amenities.find(opt => opt.key.toLowerCase() === a.toLowerCase())?.key || a
      );
      return { ...prev, amenities: normalizedAmenities };
    });
  }
}, [initialData, amenities]);

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
        <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "16px" 
          }}>
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
        <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "16px" 
          }}>
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
            Floors *
          </label>
           <input
            type="text"
            placeholder="e.g. 1, 5, 10"
            value={data.floor || ""}
            onChange={(e) =>
              setData({ ...data, floor: e.target.value })
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

        {/* Beds + Baths */}
        <div 
        style={{ display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        gap: "16px" 
        }}>
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
        </div>

        {/* Baths + Sqft */}
        <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Sqft 
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
          />
          </div>
           <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Status *
          </label>
          <CustomDropdown
  options={PROPERTY_STATUS_OPTIONS}
  value={data.status || ""}
  onChange={(value) => setData({ ...data, status: value })}
  labelKey="label"
  valueKey="value"
  placeholder="Select status"
/>
          </div>
        </div>

        {/* Status + Amenities */}
        <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "16px" }}>
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
<MultiSelectDropdown
  options={amenityOptions}
  values={data.amenities || []}
  onChange={(values) =>
    setData({ ...data, amenities: values })
  }
  labelKey="label"
  valueKey="value"
  placeholder="Select amenities"
/>
</div>
 </div>

        {/* Image */}
        <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Image 
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