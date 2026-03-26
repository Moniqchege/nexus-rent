"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import PropertyTable from "@/app/components/properties/PropertyTable";
import SearchBar from "../components/ui/SearchBar";

export default function MyRentalsPage() {
  const router = useRouter();
  const { properties, fetchProperties, loading } = useAdminStore();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to fetch properties");
    });
  }, [fetchProperties]);

  const handleRefresh = () => {
    fetchProperties().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to fetch properties");
    });
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading your rentals...
        </div>
      </div>
    );
  }

  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div className="page-tag">📊 PROPERTIES DASHBOARD</div>
      <div style={{ 
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
       }}>
        <div className="section-label">◈ MY PROPERTIES</div>
        <button
          onClick={() => router.push("/my-rentals/new")}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + New Rental
        </button>
        </div>
          <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Rental Portfolio
        </h2>
      </div>
       <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search rentals..."
      />
      {error && (
        <div style={{ 
          padding: '16px', 
          background: 'rgba(239,68,68,0.1)', 
          border: '1px solid var(--accent-danger)', 
          borderRadius: '8px', 
          marginBottom: '20px',
          color: 'var(--accent-danger)'
        }}>
          Error: {error}
        </div>
      )}
      <PropertyTable properties={filteredProperties} onRefresh={handleRefresh} />

    </div>
  );
}

