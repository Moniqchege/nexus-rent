'use client';

import { useState } from 'react';
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
      {/* Glow orb */}
      <div
        className="glow-orb"
        style={{
          top: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
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
          <button
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '12px' }}
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {/* Hero right: skyline illustration stays untouched */}
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
      background: 'radial-gradient(ellipse, rgba(0,240,255,0.08) 0%, transparent 70%)',
    }}
  ></div>

  <div className="building" style={{ left: '5%', width: '60px', height: '120px' }}>
    <div className="win" style={{ top: '20px', left: '8px', width: '10px', height: '8px' }} />
    <div className="win" style={{ top: '20px', right: '8px', width: '10px', height: '8px', animationDelay: '0.5s' }} />
    <div className="win" style={{ top: '40px', left: '8px', width: '10px', height: '8px', animationDelay: '1s' }} />
    <div className="win" style={{ top: '60px', left: '8px', width: '10px', height: '8px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '60px', right: '8px', width: '10px', height: '8px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '80px', left: '8px', width: '10px', height: '8px', animationDelay: '1.2s' }} />
  </div>

  <div className="building" style={{ left: '8%', width: '45px', height: '80px' }} />

  <div className="building" style={{ left: '12%', width: '70px', height: '200px' }}>
    <div className="win" style={{ top: '15px', left: '10px', width: '12px', height: '10px' }} />
    <div className="win" style={{ top: '15px', right: '10px', width: '12px', height: '10px', animationDelay: '0.6s' }} />
    <div className="win" style={{ top: '40px', left: '10px', width: '12px', height: '10px', animationDelay: '0.9s' }} />
    <div className="win" style={{ top: '40px', right: '10px', width: '12px', height: '10px', animationDelay: '0.2s' }} />
    <div className="win" style={{ top: '65px', left: '10px', width: '12px', height: '10px', animationDelay: '1.4s' }} />
    <div className="win" style={{ top: '65px', right: '10px', width: '12px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '90px', left: '10px', width: '12px', height: '10px', animationDelay: '1.1s' }} />
    <div className="win" style={{ top: '115px', left: '10px', width: '12px', height: '10px', animationDelay: '0.4s' }} />
    <div className="win" style={{ top: '115px', right: '10px', width: '12px', height: '10px', animationDelay: '1.3s' }} />
    <div className="win" style={{ top: '140px', left: '10px', width: '12px', height: '10px', animationDelay: '0.1s' }} />
  </div>

  <div className="building" style={{ left: '16%', width: '55px', height: '150px' }} />

  <div className="building" style={{ left: '20%', width: '90px', height: '280px' }}>
    <div className="win" style={{ top: '10px', left: '12px', width: '14px', height: '12px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)' }} />
    <div className="win" style={{ top: '10px', right: '12px', width: '14px', height: '12px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '0.5s' }} />
    <div className="win" style={{ top: '35px', left: '12px', width: '14px', height: '12px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '1s' }} />
    <div className="win" style={{ top: '60px', left: '12px', width: '14px', height: '12px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '60px', left: '12px', width: '14px', height: '12px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '85px', left: '12px', width: '14px', height: '12px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '110px', left: '12px', width: '14px', height: '12px', animationDelay: '0.6s' }} />
    <div className="win" style={{ top: '110px', left: '12px', width: '14px', height: '12px', animationDelay: '1.5s' }} />
    <div className="win" style={{ top: '135px', left: '12px', width: '14px', height: '12px', animationDelay: '0.2s' }} />
    <div className="win" style={{ top: '160px', left: '12px', width: '14px', height: '12px', animationDelay: '0.9s' }} />
    <div className="win" style={{ top: '185px', left: '12px', width: '14px', height: '12px', animationDelay: '1.1s' }} />
    <div className="win" style={{ top: '210px', left: '12px', width: '14px', height: '12px', animationDelay: '0.4s' }} />
    <div className="win" style={{ top: '235px', left: '12px', width: '14px', height: '12px', animationDelay: '0.7s' }} />
  </div>

  <div className="building" style={{ left: '25%', width: '65px', height: '180px' }} />
  <div className="building" style={{ left: '30%', width: '80px', height: '230px' }}>
    <div className="win" style={{ top: '20px', left: '10px', width: '12px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '20px', right: '10px', width: '12px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '20px', left: '30px', width: '12px', height: '10px', animationDelay: '1.2s' }} />
  </div>
  <div className="building" style={{ left: '34%', width: '50px', height: '100px' }} />
  <div className="building" style={{ left: '38%', width: '75px', height: '170px' }} />
  <div className="building" style={{ left: '42%', width: '55px', height: '130px' }} />
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