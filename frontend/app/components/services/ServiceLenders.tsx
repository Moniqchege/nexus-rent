'use client';

import { ServiceProvider } from '@/types/service';
import { useState, useEffect } from 'react';

interface ServiceLendersProps {
  providers: ServiceProvider[];
  onEdit: (provider: ServiceProvider) => void;
  onDelete: (id: number) => void;
}

export function ServiceLenders({ providers, onEdit, onDelete }: ServiceLendersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
        <div key={provider.id} className="group bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6 hover:shadow-2xl hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">SP</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{provider.name}</h3>
              <p className="text-cyan-400 text-sm font-medium">{provider.category.name}</p>
            </div>
          </div>
          <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">{provider.bio || 'Experienced service provider available for your maintenance needs.'}</p>
          <div className="flex gap-4 mb-6">
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded-full border border-yellow-500/30">
              {provider.rating}★
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/30">
              Ksh{provider.hourlyRate}/hr
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded-full border border-blue-500/30">
              {provider.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            📞 <span className="font-mono">{provider.phone}</span>
            {provider.email && (
              <>
                <span>•</span>
                <span className="truncate max-w-32">{provider.email}</span>
              </>
            )}
          </div>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button 
              onClick={() => onEdit(provider)}
              className="flex-1 bg-emerald-600/90 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-emerald-500/25"
            >
              Edit
            </button>
            <button 
              onClick={() => onDelete(provider.id)}
              className="flex-1 bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-red-500/25"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

