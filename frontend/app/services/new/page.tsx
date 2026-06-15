'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/app/lib/api';
import { ServiceForm, ServiceFormData } from '@/app/components/services/ServiceForm';

export default function NewServiceProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    phone: '',
    email: '',
    categoryId: '',
    hourlyRate: '',
    location: '',
    bio: '',
    image: '',
  });

  const handleCreateProvider = async () => {
    setLoading(true);
    try {
      await api.post('/api/services/providers', formData);
      router.push('/services');
    } catch (error) {
      console.error('Error creating provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: '12px',
            color: 'var(--neon-blue)',
          }}
        >
          PROVIDERS MANAGEMENT
        </div>

        <button
          onClick={() => router.push('/services')}
          style={{
            background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '12px 24px',
            fontSize: '14px',
          }}
        >
          ← Back
        </button>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#000000',
          marginBottom: '20px',
        }}
      >
        Create Service Provider
      </h2>

      {/* FORM */}
      <ServiceForm
        value={formData}
        onChange={setFormData}
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateProvider();
        }}
        onCancel={() => router.push('/services')}
        loading={loading}
        mode="create"
      />
    </div>
  );
}