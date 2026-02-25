'use client';

import React from 'react';

interface Property {
  id: number;
  name: string;
  location: string;
  price: number;
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
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '100px',
      }}
      onClick={onClose} 
    >
      <div
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
      >
          <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            color: '#7C3AED',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
         <h2 style={{ color: '#fff', marginBottom: '12px' }}>Available Rentals</h2>
        <div className="popup-scroll">

        <div
          className="properties-list"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
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
              }}
            >
              <div
                className="prop-img"
                style={{
                  height: '120px',
                  backgroundImage: `url(${prop.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div style={{ padding: '10px', color: '#fff', flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{prop.name}</div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>{prop.location}</div>
                <div style={{ fontWeight: 600, marginTop: '4px', color: '#7C3AED' }}>
                  KES {prop.price.toLocaleString()}
                </div>
                <button
                  style={{
                    marginTop: '8px',
                    padding: '6px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#7C3AED',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
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