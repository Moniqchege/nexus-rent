"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/app/lib/api";
import ConfirmDialog from "../ui/ConfirmDialog";

interface UnitType {
  id: number;
  propertyId: number;
  type: string;
  baths: number;
  price: number;
  totalUnits: number;
}

interface PropertyApi {
  id: number;
  title: string;
  location: string;
  floors?: string;
  status: string;
  image?: string;
  createdAt: string;
  amenities?: string[];
  unitTypes: UnitType[];
  Score?: number;
  distance?: number;
  rating?: number;
}

interface PropertyGridProps {
  properties: PropertyApi[];
  onRefresh?: () => void;
  onSaveToggle?: (id: number, saved: boolean) => void;
}

export default function PropertyGrid({ properties, onRefresh }: PropertyGridProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; propertyId?: number }>({ open: false });

  const handleDelete = async (propertyId: number) => {
    try {
      await api.delete(`/api/properties/${propertyId}`);
      onRefresh?.();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  function formatAmenity(label: string) {
    return label
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "AVAILABLE": return { text: "Available", bgColor: "#22C55E" };
      case "PENDING":   return { text: "Pending",   bgColor: "#F59E0B" };
      case "RENTED":    return { text: "Rented",    bgColor: "#EF4444" };
      default:          return { text: status || "Unknown", bgColor: "#6B7280" };
    }
  };

  return (
    <div>
      {properties.length === 0 ? (
        <div style={{ padding: "70px 40px", textAlign: "center", color: "var(--text-secondary)" }}>
          <h3 style={{ color: "var(--neon-blue)", marginBottom: "12px" }}>No rentals yet</h3>
          <p>Add your first rental property</p>
          <Link
            href="/my-rentals/new"
            className="btn-primary"
            style={{ padding: "12px 24px", marginTop: "20px", display: "inline-block" }}
          >
            + Add First Rental
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {properties.map((property) => {
            const badge = getStatusBadge(property.status);
            const amenities = (property.amenities || []).slice(0, 5);
            const units = property.unitTypes ?? [];
            const prices = units.map((u) => u.price);
            const priceLabel =
              prices.length === 0
                ? null
                : prices.length === 1 || Math.min(...prices) === Math.max(...prices)
                ? `Ksh ${Math.min(...prices).toLocaleString()}`
                : `Ksh ${Math.min(...prices).toLocaleString()} – ${Math.max(...prices).toLocaleString()}`;

            const unitSummary = units.map((u) => `${u.type} × ${u.totalUnits}`).join(", ");

            return (
              <div
                key={property.id}
                style={{
                  background: "#ffffff",
                  marginBottom: "40px",
                  marginTop: "18px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s",
                }}
              >
                {/* ── Image panel ── */}
                <div style={{ position: "relative", height: "200px", flexShrink: 0 }}>
                  {property.image &&
                  property.image.trim() !== "" &&
                  property.image !== "undefined" ? (
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.src = "/Apartments.jpg";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdf4 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "56px", opacity: 0.25 }}>🏢</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: badge.bgColor,
                      color: "#fff",
                      borderRadius: "20px",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {badge.text}
                  </span>

                  {/* AI score */}
                  {property.Score != null && (
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      🤖 {property.Score}%
                    </span>
                  )}
                </div>

                {/* ── Card body ── */}
                <div
                  style={{
                    padding: "20px 20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  {/* Title + rating */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {property.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "14px" }}
                        >
                          location_on
                        </span>
                        {property.location}
                      </div>
                    </div>
                    {property.rating != null && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#f59e0b",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          star
                        </span>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                          {property.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price range */}
                  {priceLabel && (
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--neon-blue, #2563eb)",
                      }}
                    >
                      {priceLabel}
                    </p>
                  )}

                  {/* Unit types + floors */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    {unitSummary && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "18px" }}
                        >
                          home
                        </span>
                        <span>{unitSummary}</span>
                      </div>
                    )}
                    {property.floors && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "18px" }}
                        >
                          apartment
                        </span>
                        <span>{property.floors} Floors</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "#f1f5f9",
                      width: "100%",
                      marginBottom: "14px",
                    }}
                  />

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Amenities
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginBottom: "16px",
                        }}
                      >
                        {amenities.map((a) => (
                          <span
                            key={a}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "#475569",
                            }}
                          >
                            {formatAmenity(a)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Link
                      href={`/my-rentals/edit/${property.id}`}
                      style={{
                        flex: 1,
                        display: "block",
                        textAlign: "center",
                        padding: "10px 0",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--neon-blue, #2563eb)",
                        textDecoration: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: "#fff",
                        transition: "background 0.15s",
                      }}
                    >
                      Edit Property
                    </Link>
                    <button
                      onClick={() =>
                        setDeleteDialog({ open: true, propertyId: property.id })
                      }
                      style={{
                        width: "40px",
                        height: "40px",
                        flexShrink: 0,
                        borderRadius: "10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ef444466",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                        (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#ef444466";
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                      title="Delete property"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Rental"
        message="Are you sure? This will permanently delete the rental property and associated data."
        onConfirm={() => deleteDialog.propertyId && handleDelete(deleteDialog.propertyId)}
        onCancel={() => setDeleteDialog({ open: false })}
      />
    </div>
  );
}
