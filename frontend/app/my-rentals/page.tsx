"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/lib/api";
import PropertyTable from "@/app/components/properties/PropertyTable";
import SearchBar from "../components/ui/SearchBar";

interface PropertyApi {
  id: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  image?: string;
  createdAt: string;
}

export default function MyRentalsPage() {
  const [properties, setProperties] = useState<PropertyApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/properties");
      setProperties(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
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
      <PropertyTable properties={properties} onRefresh={fetchProperties} />

    </div>
  );
}

