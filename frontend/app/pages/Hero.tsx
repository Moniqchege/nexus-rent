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
    <div className="win" style={{ top: '20px', left: '8px', width: '10px', height: '10px' }} />
    <div className="win" style={{ top: '20px', right: '8px', width: '10px', height: '10px', animationDelay: '0.5s' }} />
    <div className="win" style={{ top: '40px', left: '8px', width: '10px', height: '10px', animationDelay: '1s' }} />
    <div className="win" style={{ top: '60px', left: '8px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '60px', right: '8px', width: '10px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '80px', left: '8px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
  </div>

  <div className="building" style={{ left: '10%', width: '45px', height: '80px' }}>
    <div className="win" style={{ top: '15px', left: '5px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '35px', left: '5px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
  </div>

  <div className="building" style={{ left: '14%', width: '70px', height: '200px' }}>
    <div className="win" style={{ top: '15px', left: '10px', width: '10px', height: '10px' }} />
    <div className="win" style={{ top: '15px', right: '10px', width: '10px', height: '10px', animationDelay: '0.6s' }} />
    <div className="win" style={{ top: '40px', left: '10px', width: '10px', height: '10px', animationDelay: '0.9s' }} />
    <div className="win" style={{ top: '40px', right: '10px', width: '10px', height: '10px', animationDelay: '0.2s' }} />
    <div className="win" style={{ top: '60px', left: '10px', width: '10px', height: '10px', animationDelay: '1.4s' }} />
    <div className="win" style={{ top: '60px', right: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '80px', left: '10px', width: '10px', height: '10px', animationDelay: '1.1s' }} />
    <div className="win" style={{ top: '100px', left: '10px', width: '10px', height: '10px', animationDelay: '0.4s' }} />
    <div className="win" style={{ top: '100px', right: '10px', width: '10px', height: '10px', animationDelay: '1.3s' }} />
    <div className="win" style={{ top: '120px', left: '10px', width: '10px', height: '10px', animationDelay: '0.1s' }} />
    <div className="win" style={{ top: '140px', left: '10px', width: '10px', height: '12px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '160px', left: '10px', width: '10px', height: '12px', animationDelay: '0.7s' }} />
  </div>

  <div className="building" style={{ left: '20%', width: '55px', height: '150px' }}>
      <div className="win" style={{ top: '15px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '35px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '60px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '85px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '110px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
  </div>

  <div className="building" style={{ left: '26%', width: '90px', height: '280px' }}>
    <div className="win" style={{ top: '10px', left: '12px', width: '10px', height: '10px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)' }} />
    <div className="win" style={{ top: '10px', right: '12px', width: '10px', height: '10px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '0.5s' }} />
    <div className="win" style={{ top: '35px', left: '12px', width: '10px', height: '10px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '1s' }} />
    <div className="win" style={{ top: '50px', left: '12px', width: '10px', height: '10px', background: 'rgba(124,58,237,0.3)', borderColor: 'rgba(124,58,237,0.4)', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '65px', left: '12px', width: '10px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '85px', left: '12px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '102px', left: '12px', width: '10px', height: '10px', animationDelay: '0.6s' }} />
    <div className="win" style={{ top: '102px', left: '12px', width: '10px', height: '10px', animationDelay: '1.5s' }} />
    <div className="win" style={{ top: '117px', left: '12px', width: '10px', height: '10px', animationDelay: '0.2s' }} />
    <div className="win" style={{ top: '135px', left: '12px', width: '10px', height: '10px', animationDelay: '0.9s' }} />
    <div className="win" style={{ top: '155px', left: '12px', width: '10px', height: '10px', animationDelay: '1.1s' }} />
    <div className="win" style={{ top: '175px', left: '12px', width: '10px', height: '10px', animationDelay: '0.4s' }} />
    <div className="win" style={{ top: '195px', left: '12px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '215px', left: '12px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '235px', left: '12px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
  </div>

  <div className="building" style={{ left: '32%', width: '65px', height: '180px' }}>
    <div className="win" style={{ top: '15px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '35px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '60px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '85px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '110px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '135px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
  </div>
  <div className="building" style={{ left: '38%', width: '90px', height: '230px' }}>
    <div className="win" style={{ top: '20px', left: '10px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '20px', right: '10px', width: '10px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '20px', left: '50px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '20px', left: '30px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '35px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '60px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '85px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '110px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '135px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '160px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
    <div className="win" style={{ top: '185px', left: '10px', width: '10px', height: '10px', animationDelay: '0.7s' }} />
  </div>
  <div className="building" style={{ left: '44%', width: '70px', height: '100px' }}>
    <div className="win" style={{ top: '20px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '38px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '55px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
  </div>
  <div className="building" style={{ left: '49%', width: '75px', height: '170px' }}>
    <div className="win" style={{ top: '20px', left: '25px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '20px', right: '20px', width: '10px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '20px', left: '60px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '20px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '38px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '60px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '82px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '98px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '118px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
  </div>
  <div className="building" style={{ left: '54%', width: '85px', height: '130px' }}>
    <div className="win" style={{ top: '20px', left: '25px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '20px', right: '30px', width: '10px', height: '10px', animationDelay: '0.8s' }} />
    <div className="win" style={{ top: '20px', left: '60px', width: '10px', height: '10px', animationDelay: '1.2s' }} />
    <div className="win" style={{ top: '20px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '20px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '38px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '60px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
    <div className="win" style={{ top: '82px', left: '5px', width: '10px', height: '10px', animationDelay: '0.3s' }} />
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