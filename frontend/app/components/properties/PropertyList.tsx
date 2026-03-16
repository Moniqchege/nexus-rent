"use client";

import React from 'react';
import PropertyCard, { Property } from './PropertyCard';

interface PropertyListProps {
  properties: Property[];
  viewMode?: 'grid' | 'list';
  onPropertyClick?: (property: Property) => void;
  onSaveToggle?: (id: number, saved: boolean) => void;
  className?: string;
}

export const sampleProperties: Property[] = [
  {
    id: 1,
    title: "Sky Vista Penthouse",
    location: "Westlands, Nairobi",
    price: 2400,
    beds: 3,
    baths: 2,
    sqft: 1400,
    distance: 0.8,
    amenities: ['Pool', 'Gym', 'Parking', 'Security'],
    aiScore: 94,
    status: 'available',
    rating: 4.8,
  },
  {
    id: 2,
    title: "Aurora Residence",
    location: "Kilimani, Nairobi", 
    price: 1850,
    beds: 2,
    baths: 2,
    sqft: 980,
    distance: 1.2,
    amenities: ['Gym', 'Parking'],
    aiScore: 88,
    status: 'available',
    rating: 4.5,
  },
  {
    id: 3,
    title: "Emerald Court",
    location: "Karen, Nairobi",
    price: 3100,
    beds: 4,
    baths: 3,
    sqft: 2200,
    distance: 2.4,
    amenities: ['Garden', 'Pool', 'Security'],
    aiScore: 91,
    status: 'pending',
    rating: 4.9,
  },
  {
    id: 4,
    title: "Sapphire Studios", 
    location: "Parklands, Nairobi",
    price: 1200,
    beds: 1,
    baths: 1,
    sqft: 550,
    distance: 0.5,
    amenities: ['Parking'],
    aiScore: 76,
    status: 'available',
  },
  {
    id: 5,
    title: "The Crimson Tower",
    location: "Upper Hill, Nairobi",
    price: 5500,
    beds: 5,
    baths: 4,
    sqft: 3600,
    distance: 1.8,
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop'],
    aiScore: 83,
    status: 'available',
    rating: 4.7,
  },
  {
    id: 6,
    title: "Azure Heights",
    location: "Lavington, Nairobi",
    price: 2800,
    beds: 3,
    baths: 2,
    sqft: 1650,
    distance: 3.1,
    amenities: ['Gym', 'Security'],
    aiScore: 79,
    status: 'rented',
  }
];

export default function PropertyList({
  properties = sampleProperties,
  viewMode = 'grid',
  onPropertyClick,
  onSaveToggle,
  className = ''
}: PropertyListProps) {
  const gridClass = viewMode === 'list' 
    ? 'properties-list' 
    : 'properties-grid';

  return (
    <div className={`property-list-container ${className}`}>
      <div className={gridClass}>
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSaveToggle={onSaveToggle}
          />
        ))}
      </div>
      {properties.length === 0 && (
        <div className="no-properties" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <h3>No properties found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
}
