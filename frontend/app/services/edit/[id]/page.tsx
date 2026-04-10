'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { ServiceProvider } from '@/types/service';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';

export default function EditServiceProvider() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuthStore();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceProvider>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadProvider();
  }, [id]);

  const loadProvider = async () => {
    try {
      const { data } = await api.get(`/api/services/providers/${id}`);
      setProvider(data.provider);
      setFormData(data.provider || {});
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/services/providers/${id}`, formData);
      router.push('/services');
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;
  if (!provider) return <div className="p-6 text-center text-red-400">Provider not found</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-cyan-400 hover:text-cyan-300">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-white">Edit Service Provider</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-cyan-500/30">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={(formData.name as string) || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={(formData.bio as string) || ''}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows={4}
            className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input 
              type="tel" 
              value={(formData.phone as string) || ''} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input 
              type="email" 
              value={(formData.email as string) || ''} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input 
              type="text" 
              value={(formData.location as string) || ''} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate (Ksh)</label>
            <input 
              type="number" 
              value={formData.hourlyRate || 0} 
              onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
              className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category ID</label>
          <input 
            type="number" 
            value={formData.categoryId || 0} 
            onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value)})} 
            className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" 
          />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all">
          {saving ? 'Saving...' : 'Update Provider'}
        </button>
      </form>
    </div>
  );
}

