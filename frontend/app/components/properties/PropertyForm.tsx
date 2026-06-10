"use client";

import { PROPERTY_STATUS_OPTIONS } from "@/app/lib/utils";
import { useAdminStore } from "@/app/store/adminStore";
import React, { useEffect, useState } from "react";
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
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.image || null
  );
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

  const amenityOptions: Option[] = amenities.map((a) => ({
    label: formatLabel(a.label),
    value: a.key,
  }));

  useEffect(() => {
    if (initialData.amenities && amenities.length > 0) {
      setData((prev) => {
        if (prev.amenities && prev.amenities.length > 0) return prev;

        const normalizedAmenities = initialData.amenities!.map(
          (a) =>
            amenities.find((opt) => opt.key.toLowerCase() === a.toLowerCase())
              ?.key || a
        );
        return { ...prev, amenities: normalizedAmenities };
      });
    }
  }, [initialData, amenities]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setData({ ...data, image: previewURL });
    }
  };

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
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
    }}
  >
    {/* Header */}
    <div
  style={{
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  }}
>
  <div>
    <h1
      style={{
        fontSize: "26px",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "8px",
      }}
    >
      {isEdit ? "Edit Property" : "Create Property"}
    </h1>

    <p
      style={{
        color: "var(--text-secondary)",
        fontSize: "12px",
      }}
    >
      Add a new premium asset to your rental portfolio.
    </p>
  </div>

  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(79,70,229,0.08)",
      color: "var(--neon-blue)",
      padding: "8px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    ⚡ Smart Listing Enabled
  </div>
</div>


    {error && (
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          marginBottom: "20px",
          background: "rgba(239,68,68,.08)",
          border: "1px solid rgba(239,68,68,.2)",
          color: "#ef4444",
        }}
      >
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "350px 1fr",
          gap: "24px",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Image Upload */}
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "16px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              Property Hero Image
            </label>

            <div
              style={{
                position: "relative",
                height: "350px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "2px dashed var(--border-glow)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {data.image ? (
                <img
                  src={data.image}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "40px",
                      marginBottom: "12px",
                    }}
                  >
                    ☁️
                  </div>

                  <div style={{ fontWeight: 600 }}>
                    Click to Upload
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "6px",
                    }}
                  >
                    JPG / PNG
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    setImageFile(file);

                    const previewURL =
                      URL.createObjectURL(file);

                    setData({
                      ...data,
                      image: previewURL,
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Visibility */}
          <div
            style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "16px",
              }}
            >
              Visibility Settings
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <span>Public Listing</span>
              <input type="checkbox" defaultChecked />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Featured Asset</span>
              <input type="checkbox" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* General Details */}
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "24px",
              zIndex: 20,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "20px",
                fontSize: "18px",
              }}
            >
              General Details
            </h3>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              <input
                type="text"
                placeholder="Property Title"
                value={data.title || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    title: e.target.value,
                  })
                }
                className="form-input"
                required
              />

              <input
                type="text"
                placeholder="Location"
                value={data.location || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    location: e.target.value,
                  })
                }
                className="form-input"
                required
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    isMobile ? "1fr" : "1fr 1fr",
                  gap: "16px",
                }}
              >
                <input
                  type="number"
                  placeholder="Price (Ksh)"
                  value={data.price || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      price:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  className="form-input"
                  required
                />

                <CustomDropdown
                  options={PROPERTY_STATUS_OPTIONS}
                  value={data.status || ""}
                  onChange={(value) =>
                    setData({
                      ...data,
                      status: value,
                    })
                  }
                  labelKey="label"
                  valueKey="value"
                  placeholder="Select status"
                />
              </div>
            </div>
          </div>

          {/* Physical Specs */}
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "20px",
                fontSize: "18px",
              }}
            >
              Physical Specs
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  isMobile
                    ? "1fr 1fr"
                    : "repeat(4,1fr)",
                gap: "16px",
              }}
            >
              <input
                type="number"
                placeholder="Beds"
                value={data.beds || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    beds:
                      parseInt(e.target.value) || 0,
                  })
                }
                className="form-input"
              />

              <input
                type="number"
                placeholder="Baths"
                value={data.baths || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    baths:
                      parseInt(e.target.value) || 0,
                  })
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Floors"
                value={data.floor || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    floor: e.target.value,
                  })
                }
                className="form-input"
              />

              <input
                type="number"
                placeholder="Sqft"
                value={data.sqft || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    sqft:
                      parseInt(e.target.value) || 0,
                  })
                }
                className="form-input"
              />
            </div>
          </div>

          {/* Amenities */}
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "20px",
                fontSize: "18px",
              }}
            >
              Amenities
            </h3>

            <MultiSelectDropdown
              options={amenityOptions}
              values={data.amenities || []}
              onChange={(values) =>
                setData({
                  ...data,
                  amenities: values,
                })
              }
              labelKey="label"
              valueKey="value"
              placeholder="Select amenities"
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                border: "1px solid var(--border-glow)",
                background: "transparent",
                padding: "12px 24px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                background:
                  "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading
                ? "Saving..."
                : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
);
}