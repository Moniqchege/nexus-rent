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
  onSaveToggle?: (id: number, saved: boolean) => void;
}

export default function PropertyGrid({ properties, onRefresh, onSaveToggle }: PropertyGridProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; propertyId?: number }>({ open: false });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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
    case 'ACTIVE':
      return { text: 'Available', color: 'var(--accent-success)' };
    case 'PENDING':
      return { text: 'Pending', color: '#FFB84D' };
    case 'RENTED':
      return { text: 'Rented', color: 'var(--accent-danger)' };
    default:
      return { text: status?.toUpperCase() || 'UNKNOWN', color: 'var(--text-secondary)' };
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
            const amenities = property.amenities || [];
            const isSavedForThis = isSaved;

            return (
              <div
                key={property.id}
                className="property-card"
                style={{
                  marginBottom: "52px"
                }}
              >
                <div className="prop-img">
                  <div className="prop-img-inner">
                    {property.image ? (
                     <Image
  src={
    property.image && property.image.trim() !== "" && property.image !== "undefined"
      ? property.image
      : "/Apartments.jpg"
  }
  alt={property.title}
  fill
  className="prop-img-bg"
  onError={(e) => {
    e.currentTarget.src = "/Apartments.jpg";
  }}
/>
                     ) : (
                <div className="prop-img-placeholder prop-bg-1">
                     <span style={{ fontSize: '60px', opacity: 0.15 }}>🏠</span>
                </div>
                )}
                <div className="ai-badge">
                 🤖 Score {property.Score}%
               </div>
               <div className="status-badge" style={{ 
            position: 'absolute', 
            bottom: '12px', 
            left: '12px',
            background: `rgba(0,0,0,0.2)`,
            color: badge.color,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600
          }}>
            {badge.text}
          </div>
          <button className="save-btn"
          onClick={() => {
        const newSaved = !isSavedForThis;
        setIsSaved(newSaved);
        onSaveToggle?.(property.id, newSaved); 
      }}
          >
            {isSaved ? '♥' : '♡'}
          </button>
                  </div>
                </div>

                <div className="prop-body">
                  <div className="prop-price">
                    ksh{property.price.toLocaleString()} <span>/month</span>
                  </div>
                  <div className="prop-name">{property.title}</div>
                  <div className="prop-loc">📍 {property.location}</div>
                  <div className="prop-meta">
                    <div className="meta-item">
                      <span className="meta-icon">⊞</span> {property.beds} Beds
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">◎</span> {property.baths} Baths
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">▣</span> {property.sqft.toLocaleString()} sqft
                    </div>
                  </div>
                  {amenities.length > 0 && (
  <div className="prop-amenities" style={{ 
      marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-glow)',
            fontSize: '10px',
            color: 'var(--text-secondary)'
  }}>
    {amenities.slice(0, 3).join(', ')}
    {amenities.length > 3 && '...'}
  </div>
)}

        {property.rating && (
          <div className="prop-rating" style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#FFB84D',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ★ {property.rating.toFixed(1)}
          </div>
        )}
                </div>
                 <div style={{ display: "flex", gap: "8px", marginTop: "auto", padding: "10px", justifyContent: "flex-end" }}>
                    <Link
                      href={`/my-rentals/edit/${property.id}`}
                      className="action-btn"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => confirmDelete(property.id)}
                      disabled={deletingId === property.id}
                      className="action-btn"
                    >
                      {deletingId === property.id ? "Deleting..." : "Delete"}
                    </button>
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