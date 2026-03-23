"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/app/lib/api";
import ConfirmDialog from "../ui/ConfirmDialog";

interface PropertyApi {
  id: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  image?: string;
  createdAt: string;
  amenities?: string[];
  Score?: number;
  distance?: number;
  rating?: number;
}

interface PropertyGridProps {
  properties: PropertyApi[];
  onRefresh?: () => void;
}

export default function PropertyGrid({ properties, onRefresh }: PropertyGridProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; propertyId?: number }>({ open: false });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (propertyId: number) => {
    setDeletingId(propertyId);
    try {
      await api.delete(`/api/properties/${propertyId}`);
      onRefresh?.();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setDeletingId(null);
      setDeleteDialog({ open: false });
    }
  };

  const confirmDelete = (propertyId: number) => {
    setDeleteDialog({ open: true, propertyId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "available":
        return { text: "Available", color: "var(--accent-success)" };
      case "pending":
        return { text: "Pending", color: "#FFB84D" };
      case "rented":
        return { text: "Rented", color: "var(--accent-danger)" };
      default:
        return { text: status.toUpperCase(), color: "var(--text-secondary)" };
    }
  };

  return (
    <div>
      {properties.length === 0 ? (
        <div
          style={{
            padding: "120px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>🏠</div>
          <h3 style={{ color: "var(--neon-blue)", marginBottom: "12px" }}>No rentals yet</h3>
          <p>Add your first rental property</p>
          <Link
            href="/my-rentals/new"
            className="btn-primary"
            style={{
              padding: "12px 24px",
              marginTop: "20px",
              display: "inline-block",
            }}
          >
            + Add First Rental
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {properties.map((property) => {
            const badge = getStatusBadge(property.status);

            return (
              <div
                key={property.id}
                className="property-card"
                style={{
                  backgroundColor: "rgba(17,24,39,0.8)",
                  border: "1px solid var(--border-glow)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <div
                  className="prop-img"
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "60%",
                    overflow: "hidden",
                  }}
                >
                  {property.image ? (
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      className="prop-img-bg"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        background: "rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "60px",
                        opacity: 0.15,
                        height: "100%",
                        width: "100%",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    >
                      🏠
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(0,0,0,0.7)",
                      color: badge.color,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                    }}
                  >
                    {badge.text}
                  </div>
                </div>

                <div
                  className="prop-body"
                  style={{
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    flexGrow: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--accent-success)",
                    }}
                  >
                    KSh {property.price?.toLocaleString()}
                  </div>
                  <div style={{ fontWeight: 500 }}>{property.title}</div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{property.location}</div>
                  <div style={{ fontSize: "12px" }}>
                    {property.beds}/{property.baths} Beds/Baths • {property.sqft?.toLocaleString()} sqft
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    <Link
                      href={`/my-rentals/edit/${property.id}`}
                      className="btn-small"
                      style={{
                        background: "rgba(59,130,246,0.1)",
                        color: "var(--neon-blue)",
                        border: "1px solid var(--neon-blue)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        textDecoration: "none",
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => confirmDelete(property.id)}
                      disabled={deletingId === property.id}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        color: "var(--accent-danger)",
                        border: "1px solid var(--accent-danger)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {deletingId === property.id ? "Deleting..." : "Delete"}
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