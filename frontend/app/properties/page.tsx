"use client";
import React from "react";
import PropertyList, { sampleProperties } from "../components/properties/PropertyList";
import { useRouter } from "next/navigation";

export default function PropertiesPage() {
  const router = useRouter();

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 16px 0' }}>
          Available Properties
        </h1>
        <p style={{ fontSize: '20px', color: 'var(--text-secondary)', margin: 0 }}>AI-powered rental recommendations near you</p>
      </div>
      <PropertyList 
        properties={sampleProperties} 
        viewMode="grid"
      />
    </div>
  );
}

