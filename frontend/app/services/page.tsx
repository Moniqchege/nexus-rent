 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { ServiceCategory, ServiceProvider } from '@/types/service';
import { ServiceLenders } from '../components/services/ServiceLenders';

export default function ServiceLendersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const catsResp = await api.get('/api/services/categories');
      setCategories(catsResp.data.categories || []);

      const provResp = await api.get('/api/services/providers');
      setProviders(provResp.data.providers || []);
    } catch (error) {
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    router.push('/services/new');
  };

  const handleEdit = (provider: ServiceProvider) => {
    router.push(`/services/edit/${provider.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this provider?')) return;
    try {
      await api.delete(`/api/services/providers/${id}`);
      setProviders(providers.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading service lenders...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Service Lenders</h1>
        <button 
          onClick={handleAddProvider} 
          className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all"
        >
          + Add Provider
        </button>
      </div>
      <ServiceLenders 
        providers={providers} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}



