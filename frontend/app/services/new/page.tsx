'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/app/lib/api';
import { ServiceForm } from '@/app/components/services/ServiceForm';

export default function NewServiceProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateProvider = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/api/services/providers', data);
      router.push('/services');
    } catch (error) {
      console.error('Error creating provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">🏦 SERVICE LENDERS</div>

      {/* Section label + back button (MATCH ROLES) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "16px",
            color: "var(--neon-blue)"
          }}
        >
          PROVIDERS MANAGEMENT
        </div>

        <button
          onClick={() => router.push('/services')}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "12px 24px",
            fontSize: "14px"
          }}
        >
          ← Back
        </button>
      </div>

      {/* Main heading */}
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--neon-purple)",
          marginBottom: "20px"
        }}
      >
        Create Service Provider
      </h2>

      {/* FORM (reused like RoleForm) */}
      <ServiceForm
        onSubmit={handleCreateProvider}
        onCancel={() => router.push('/services')}
        loading={loading}
      />
    </div>
  );
}