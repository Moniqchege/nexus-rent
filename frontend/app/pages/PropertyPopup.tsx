'use client';

import React from 'react';
import { X, MapPin, Home } from 'lucide-react';

interface Property {
  id: number;
  name: string;
  location: string;
  price?: number;
  image: string;
}

interface PropertyPopupProps {
  properties: Property[];
  onClose: () => void;
}

export default function PropertyPopup({ properties, onClose }: PropertyPopupProps) {
  return (
    <div
      className="popup-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '80px',
        padding: '80px 16px 24px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#ffffff' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-glow)',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
        <div style={{ marginBottom: 16, paddingRight: 40 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Available Rentals
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Showing {properties.length} properties
          </p>
        </div>

        <div className="popup-scroll">
          <div
            className="properties-list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="property-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                <div
                  className="prop-img"
                  style={{
                    height: '120px',
                    backgroundImage: `url(${prop.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'var(--bg-muted)',
                  }}
                />
                <div style={{ padding: '12px', flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {prop.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <MapPin size={12} />
                    {prop.location}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--neon-blue)',
                      marginBottom: 10,
                      fontSize: 15,
                    }}
                  >
                    ksh {prop.price != null ? prop.price.toLocaleString() : '—'}
                  </div>
                  <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
                    <Home size={12} style={{ marginRight: 4 }} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
