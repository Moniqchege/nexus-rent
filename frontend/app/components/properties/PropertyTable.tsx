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
  floor?: string;
  price: number;
  beds: number;
  baths: number;
  sqft?: number | null;
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

  function formatAmenity(label: string) {
  return label
    .toLowerCase()               
    .replace(/_/g, " ")          
    .replace(/\b\w/g, (l) => l.toUpperCase()); 
  }

  const confirmDelete = (propertyId: number) => {
    setDeleteDialog({ open: true, propertyId });
  };

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
      return { text: 'Available', bgColor: '#22C55E' }; 
    case 'PENDING':
      return { text: 'Pending', bgColor: '#F59E0B' }; 
    case 'RENTED':
      return { text: 'Rented', bgColor: '#EF4444' }; 
    default:
      return { text: status || 'Unknown', bgColor: '#6B7280' }; 
  }
};


  return (
    <div>
      {properties.length === 0 ? (
        <div
          style={{
            padding: "70px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
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
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
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
                  marginBottom: "52px",
                  marginTop: "20px"
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
       <div 
       className="status-badge" 
       style={{ 
         position: 'absolute', 
         bottom: '1px', 
         left: '12px',
        background: badge.bgColor,
         borderRadius: "18px",
         color: '#ffffff',
         padding: '5px 16px',
         fontSize: '11px',
         fontFamily: "'JetBrains Mono', monospace",
         fontWeight: 600,
         marginBottom: '6px',
         boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
       <div 
       className="prop-body">
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  }}
>
  <h3 className="prop-name">
    {property.title}
  </h3>

  <span
    style={{
      color: "var(--primary)",
      fontWeight: 700,
      fontSize: "20px",
    }}
  >
    ksh {property.price.toLocaleString()}
  </span>
</div>
       <div className="prop-loc">📍 {property.location}</div>
       <div className="property-meta-grid">
  <div className="meta-box">
    🛏
    <span>{property.beds} Beds</span>
  </div>

  <div className="meta-box">
    🛁
    <span>{property.baths} Baths</span>
  </div>

  <div className="meta-box">
    🏠
    <span>{property.floor} Floors</span>
  </div>

  {property.sqft && (
    <div className="meta-box">
      ⬜
      <span>{property.sqft.toLocaleString()} sqft</span>
    </div>
  )}
</div>
         {amenities.length > 0 && (
       <div 
       className="prop-amenities" 
       style={{ 
         marginTop: '12px',
         paddingTop: '12px',
         borderTop: '1px solid var(--border-glow)',
         fontSize: '10px',
         color: 'var(--text-secondary)'
       }}>
         {amenities.map(formatAmenity).join(', ')}
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
                <div className="card-actions">
  <Link
    href={`/my-rentals/edit/${property.id}`}
    className="edit-btn"
  >
     Edit
  </Link>

  <button
    onClick={() => confirmDelete(property.id)}
    className="delete-btn"
  >
    🗑️
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