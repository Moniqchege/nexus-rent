'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceProvider } from '@/types/service';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';

export default function NewServiceProvider() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [formData, setFormData] = useState<Partial<ServiceProvider>>({
    name: '',
    bio: '',
    phone: '',
    email: '',
    location: '',
    hourlyRate: 0,
    categoryId: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/services/providers', formData);
      router.push('/services');
      router.refresh();
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-cyan-400 hover:text-cyan-300">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-white">Add New Service Provider</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-cyan-500/30">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows={4}
            className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input type="text" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate (Ksh)</label>
            <input type="number" value={formData.hourlyRate || 0} onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})} className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category ID</label>
          <input type="number" value={formData.categoryId || 0} onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value)})} className="w-full p-3 bg-slate-700/50 border border-cyan-400/30 rounded-xl text-white" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all">
          {loading ? 'Creating...' : 'Create Provider'}
        </button>
      </form>
    </div>
  );
}

