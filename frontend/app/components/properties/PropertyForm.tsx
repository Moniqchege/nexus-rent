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

const UNIT_TYPE_OPTIONS: Option[] = [
  { value: "single_room", label: "Single Room" },
  { value: "bedsitter", label: "Bedsitter (Studio)" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedroom" },
  { value: "3br", label: "3 Bedroom" },
  { value: "3br_dsq", label: "3 Bedroom + DSQ" },
  { value: "4br", label: "4 Bedroom " },
  { value: "4br_dsq", label: "4 Bedroom + DSQ" },
  { value: "duplex", label: "Duplex" },
  { value: "penthouse", label: "Penthouse" },
  { value: "townhouse", label: "Townhouse" },
  { value: "maisonette", label: "Maisonette" },
  { value: "bungalow", label: "Bungalow" },
];

interface UnitType {
  id: string;
  type: string; // value from UNIT_TYPE_OPTIONS, e.g. "2br"
  baths: number;
  price: number;
  totalUnits: number;
}

interface PropertyApi {
  id?: number;
  title: string;
  location: string;
  floors?: string;
  status: string;
  amenities?: string[];
  image?: string;
  createdAt?: string;
  unitTypes: UnitType[];
}

interface PropertyFormProps {
  initialData?: Partial<PropertyApi>;
  onSuccess?: (data: Partial<PropertyApi>) => void | Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
  onCancel: () => void;
}

const emptyUnitType = (): UnitType => ({
  id: crypto.randomUUID(),
  type: "",
  baths: 0,
  price: 0,
  totalUnits: 0,
});

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
    unitTypes:
      initialData.unitTypes && initialData.unitTypes.length > 0
        ? initialData.unitTypes
        : [emptyUnitType()],
  }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { amenities, fetchAmenities } = useAdminStore();

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth <= 768);
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
      const previewURL = URL.createObjectURL(file);
      setData((prev) => ({ ...prev, image: previewURL }));
    }
  };

  // --- Unit type helpers ---
  const updateUnitType = (id: string, field: keyof UnitType, value: any) => {
    setData((prev) => ({
      ...prev,
      unitTypes: (prev.unitTypes || []).map((u) =>
        u.id === id ? { ...u, [field]: value } : u
      ),
    }));
  };

  const addUnitType = () => {
    setData((prev) => ({
      ...prev,
      unitTypes: [...(prev.unitTypes || []), emptyUnitType()],
    }));
  };

  const removeUnitType = (id: string) => {
    setData((prev) => ({
      ...prev,
      unitTypes: (prev.unitTypes || []).filter((u) => u.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSuccess) return;

    if (!data.unitTypes || data.unitTypes.length === 0) {
      setError("Add at least one unit type.");
      return;
    }
    if (data.unitTypes.some((u) => !u.type)) {
      setError("Select a unit type for every entry.");
      return;
    }

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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2px", overflowY: "auto", paddingBottom: "40px" }}>
      {error && (
        <div style={{ padding: "14px", borderRadius: "12px", marginBottom: "20px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "350px 1fr", gap: "6px" }}>
          {/* LEFT COLUMN — image, unchanged */}
          <div>
            <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--border-glow)", borderRadius: "20px", padding: "16px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "12px", fontSize: "14px" }}>
                Property Hero Image
              </label>
              <div style={{ position: "relative", height: "350px", borderRadius: "16px", overflow: "hidden", border: "2px dashed var(--border-glow)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
                {data.image ? (
                  <img src={data.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>☁️</div>
                    <div style={{ fontWeight: 600 }}>Click to Upload</div>
                    <div style={{ fontSize: "10px", marginTop: "6px" }}>JPG / PNG</div>
                  </div>
                )}
                <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={handleImageChange} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* General Details — building-level only */}
            <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--border-glow)", borderRadius: "20px", padding: "24px", zIndex: 22 }}>
              <h3 style={{ fontWeight: 700, marginBottom: "20px", fontSize: "14px" }}>General Details</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                <input type="text" placeholder="Property Title" value={data.title || ""} onChange={(e) => setData({ ...data, title: e.target.value })} className="form-input" required />
                <input type="text" placeholder="Location" value={data.location || ""} onChange={(e) => setData({ ...data, location: e.target.value })} className="form-input" required />
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                  <input type="text" placeholder="Total Floors" value={data.floors || ""} onChange={(e) => setData({ ...data, floors: e.target.value })} className="form-input" />
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
            </div>

            {/* Unit Types */}
            <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--border-glow)", borderRadius: "20px", padding: "24px", zIndex: 21 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "14px" }}>Unit Types</h3>
                <button
                  type="button"
                  onClick={addUnitType}
                  style={{ border: "1px solid var(--neon-blue)", background: "transparent", color: "var(--neon-blue)", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  + Add Unit Type
                </button>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {(data.unitTypes || []).map((unit, idx) => (
                  <div key={unit.id} style={{ border: "1px solid var(--border-glow)", borderRadius: "14px", padding: "16px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Unit Type {idx + 1}
                    </span>
                {(data.unitTypes || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUnitType(unit.id)}
                    style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                  >
                    Remove
                  </button>
                )}
             </div>

      <div style={{ marginBottom: "12px" }}>
        <CustomDropdown
          options={UNIT_TYPE_OPTIONS}
          value={unit.type}
          onChange={(value) => updateUnitType(unit.id, "type", value)}
          labelKey="label"
          valueKey="value"
          placeholder="Select unit type"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "10px" }}>
  <div>
    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
      Price (Ksh)
    </label>
    <input
      type="number"
      placeholder="e.g. 15000"
      value={unit.price || ""}
      onChange={(e) => updateUnitType(unit.id, "price", parseFloat(e.target.value) || 0)}
      className="form-input"
      required
    />
  </div>

  <div>
    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
      Baths
    </label>
    <input
      type="number"
      placeholder="e.g. 1"
      value={unit.baths || ""}
      onChange={(e) => updateUnitType(unit.id, "baths", parseInt(e.target.value) || 0)}
      className="form-input"
    />
  </div>

  <div>
    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
      No. of Units
    </label>
    <input
      type="number"
      placeholder="e.g. 3"
      value={unit.totalUnits || ""}
      onChange={(e) => updateUnitType(unit.id, "totalUnits", parseInt(e.target.value) || 0)}
      className="form-input"
      required
    />
  </div>
</div>
    </div>
  ))}
</div>
            </div>

            {/* Amenities — building-wide */}
            <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid var(--border-glow)", borderRadius: "20px", padding: "24px", zIndex:22 }}>
              <h3 style={{ fontWeight: 700, marginBottom: "20px", fontSize: "14px" }}>Building Amenities</h3>
              <MultiSelectDropdown
                options={amenityOptions}
                values={data.amenities || []}
                onChange={(values) => setData({ ...data, amenities: values })}
                labelKey="label"
                valueKey="value"
                placeholder="Select amenities"
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={onCancel} style={{ border: "1px solid var(--border-glow)", background: "transparent", padding: "12px 24px", borderRadius: "12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}>
                {loading ? "Saving..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}