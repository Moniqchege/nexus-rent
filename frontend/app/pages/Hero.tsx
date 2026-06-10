'use client';

import { useState } from 'react';
import { Search, MapPin, Home, Shield, TrendingUp, Building2 } from 'lucide-react';
import PropertyPopup from './PropertyPopup';

const mockProperties = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name: `Property ${i + 1}`,
  location: 'Westlands, Nairobi',
  price: 50000 + i * 5000,
  image: '/studio.jpg',
}));

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(mockProperties);
  const [showPopup, setShowPopup] = useState(false);

  const handleSearch = () => {
    const filtered = searchTerm
      ? mockProperties.filter((p) =>
          p.location.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : mockProperties;

    setFilteredProperties(filtered);
    setShowPopup(true);
  };

  return (
    <section className="hero">
      {/* Hero left: search & header */}
      <div className="hero-left animate-in">
        <div className="page-tag">◈ RENTAL PLATFORM</div>

        <h1>
          Find <span>Smart Rentals</span>
          <br />
          Near You
        </h1>

        <p>
          Discover properties that match your needs with dynamic listings and
          hyperlocal market insights.
        </p>

        {/* Search bar */}
        <div className="nav-search" style={{ width: '100%', maxWidth: '500px' }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by location, e.g. Westlands, Nairobi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <button
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '13px' }}
            onClick={handleSearch}
          >
            Search
          </button>
        </div>

        {/* View toggles */}
        <div className="view-toggles" style={{ marginTop: 24 }}>
          <button className="toggle-btn active">Apartments</button>
          <button className="toggle-btn">Houses</button>
          <button className="toggle-btn">Studios</button>
          <button className="toggle-btn">Commercial</button>
        </div>
      </div>

      {/* Hero right: clean illustration card */}
      <div className="hero-right animate-in delay-2">
        <div className="hero-card-illustration">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-glow)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--neon-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Featured Building
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Kileleshwa, Nairobi
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-muted)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Home size={18} color="var(--neon-blue)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Available units
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                24 units
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div
              style={{
                background: 'var(--bg-muted)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MapPin size={16} color="var(--accent-success)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Occupancy</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  89%
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-muted)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={16} color="var(--neon-purple)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Avg Rent</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  KES 65K
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'var(--bg-muted)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Shield size={16} color="var(--accent-warning)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Safety</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  A+
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Building2 size={16} color="var(--neon-blue)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Type</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neon-blue)' }}>
                  Premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="neon-divider" />

      {/* Property Popup opens only after search */}
      {showPopup && (
        <PropertyPopup
          properties={filteredProperties}
          onClose={() => setShowPopup(false)}
        />
      )}
    </section>
  );
}
