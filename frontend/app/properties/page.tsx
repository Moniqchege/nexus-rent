"use client";
import React from "react";
import PropertyList, { sampleProperties } from "../components/properties/PropertyList";
import { useRouter } from "next/navigation";

export default function PropertiesPage() {
  const router = useRouter();

  return (
    <div className="dashboard-content">
      <div className="page-tag">📊 PROPERTIES DASHBOARD</div>
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">◈ MY PROPERTIES</div>
        <div className="section-title">Rental Portfolio Overview</div>
      </div>
      <PropertyList properties={sampleProperties} />
    </div>
  );
}

