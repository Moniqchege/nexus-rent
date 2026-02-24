'use client';

import { useState } from 'react';

const mockProperties = [
  {
    id: 1,
    name: 'Cozy Studio Apartment',
    location: 'Westlands, Nairobi',
    price: 75000,
    image: '/properties/studio.jpg',
  },
  {
    id: 2,
    name: 'Modern 2-Bed Apartment',
    location: 'Westlands, Nairobi',
    price: 120000,
    image: '/properties/2bed.jpg',
  },
  {
    id: 3,
    name: 'Luxury 3-Bed Condo',
    location: 'Westlands, Nairobi',
    price: 250000,
    image: '/properties/3bed.jpg',
  },
];


export default function Hero() {
 const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(mockProperties);
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');

 const handleSearch = () => {
    if (!searchTerm) {
      setFilteredProperties(mockProperties);
      return;
    }

    const filtered = mockProperties.filter((prop) =>
      prop.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProperties(filtered);
  };

    const handleViewToggle = (mode: 'grid' | 'split') => setViewMode(mode);

  return (
    <section className="hero">
      {/* Glow orb */}
      <div
        className="glow-orb"
        style={{
          top: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

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
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Westlands, Nairobi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* View toggles */}
        {/* <div className="view-toggles">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => handleViewToggle('grid')}
          >
            ⊞ Grid
          </button>
          <button
            className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => handleViewToggle('map')}
          >
            ⊙ Map
          </button>
          <button
            className={`toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => handleViewToggle('split')}
          >
            ⊟ Split
          </button>
        </div> */}
      </div>

      {/* Hero right: skyline illustration */}
      <div className="hero-right animate-in delay-2">
        <div className="skyline">
          <div
            className="glow-orb"
            style={{
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '150px',
              background:
                'radial-gradient(ellipse, rgba(0,240,255,0.08) 0%, transparent 70%)',
            }}
          />

          <div className="building" style={{ left: '5%', width: '50px', height: '120px' }} />
          <div className="building" style={{ left: '18%', width: '60px', height: '200px' }} />
          <div className="building" style={{ left: '38%', width: '80px', height: '280px' }} />
          <div className="building" style={{ left: '62%', width: '70px', height: '230px' }} />
          <div className="building" style={{ right: 0, width: '45px', height: '130px' }} />
        </div>
      </div>

      <div className="neon-divider" />
    </section>
  );
}