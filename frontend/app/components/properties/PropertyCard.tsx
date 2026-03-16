"use client";

import React, { useState } from 'react';
import Image from 'next/image';

export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  distance: number;
  image?: string;
  amenities: string[];
  Score: number;
  status: 'available' | 'pending' | 'rented';
  rating?: number;
}

interface PropertyCardProps {
  property: Property;
  onSaveToggle?: (id: number, saved: boolean) => void;
}

export default function PropertyCard({ property, onSaveToggle }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    onSaveToggle?.(property.id, newSaved);
  };

  const getStatusBadge = () => {
    switch (property.status) {
      case 'available': return { text: 'Available', color: 'var(--accent-success)' };
      case 'pending': return { text: 'Pending', color: '#FFB84D' };
      case 'rented': return { text: 'Rented', color: 'var(--accent-danger)' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="property-card">
      <div className="prop-img">
        <div className="prop-img-inner">
          {property.image ? (
            <Image 
              src={property.image} 
              alt={property.title}
              fill
              className="prop-img-bg"
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
            background: `rgba(0,0,0,0.7)`,
            color: badge.color,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600
          }}>
            {badge.text}
          </div>
          <button className="save-btn" onClick={handleSave}>
            {isSaved ? '♥' : '♡'}
          </button>
        </div>
      </div>
      <div className="prop-body">
        <div className="prop-price">
          ${property.price.toLocaleString()} <span>/month</span>
        </div>
        <div className="prop-name">{property.title}</div>
        <div className="prop-loc">
          📍 {property.location}
        </div>
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
          <div className="meta-item">
            <span className="meta-icon">◉</span> {property.distance} km
          </div>
        </div>
        {property.amenities.length > 0 && (
          <div className="prop-amenities" style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-glow)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            {property.amenities.slice(0, 3).join(', ')}
            {property.amenities.length > 3 && '...'}
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
    </div>
  );
}
