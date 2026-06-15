'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { ServiceProvider } from '@/types/service';
import api from '@/app/lib/api';
import { ServiceForm, ServiceFormData } from '@/app/components/services/ServiceForm';

export default function EditServiceProvider() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? String(params.id) : null;

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    // Guard early
    if (!id || id === 'undefined') {
      router.push('/services');
      return;
    }

    let cancelled = false;

    const loadProvider = async () => {
      try {
        const { data } = await api.get(`/api/services/providers/${id}`);
        
        if (cancelled) return;

        // Backend returns provider directly, not wrapped in { provider: ... }
        const p: ServiceProvider = data;

        setProvider(p);
        setFormData({
          name: p.name || '',
          phone: p.phone || '',
          email: p.email || '',
          categoryId: p.categoryId || '',
          hourlyRate: p.hourlyRate || '',
          location: p.location || '',
          bio: p.bio || '',
          image: p.image || '',
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Load error:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProvider();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleUpdateProvider = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/services/providers/${id}`, formData); 
      router.push('/services');
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }

  if (!provider) {
    return <div className="p-6 text-center text-red-400">Provider not found</div>;
  }

  return (
    <div className="dashboard-content">
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


      <ServiceForm
        value={formData}
        onChange={setFormData}
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateProvider();
        }}
        onCancel={() => router.push('/services')}
        loading={saving}
        mode="edit"
      />
  </div>
  );
}