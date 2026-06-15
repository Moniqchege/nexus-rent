'use client';

import { CustomDropdown } from '../ui/CustomDropdown';

export interface ServiceFormData {
  name: string;
  phone: string;
  email: string;
  categoryId: string | number;
  hourlyRate: string | number;
  location: string;
  bio: string;
  image?: string;
}

interface ServiceFormProps {
  value: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function ServiceForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}: ServiceFormProps) {
  const inputStyle = {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border-glow)',
    borderRadius: '12px',
    padding: '10px 20px',
    fontSize: '16px',
    color: 'var(--text-primary)',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    fontSize: '12px',
    marginBottom: '6px',
    color: 'var(--neon-blue)',
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glow)',
        borderRadius: '24px',
        padding: '25px',
        marginBottom: '32px',
      }}
    >
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 700,
          background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
        }}
      >
        {mode === 'edit' ? 'Edit Provider' : 'Create New Provider'}
      </h3>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Provider Name *</label>
            <input
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              style={inputStyle}
              placeholder="John's Plumbing Services"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Phone *</label>
            <input
              type="tel"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              style={inputStyle}
              placeholder="+254 712 345 678"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
              style={inputStyle}
              placeholder="provider@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Rate (Ksh/hr)</label>
            <input
              type="number"
              value={value.hourlyRate}
              onChange={(e) => onChange({ ...value, hourlyRate: e.target.value })}
              style={inputStyle}
              placeholder="750"
              disabled={loading}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Service Category *</label>
          <CustomDropdown
            options={[
              { id: 1, name: 'Cleaning' },
              { id: 2, name: 'Plumbing' },
              { id: 3, name: 'Movers' },
              { id: 4, name: 'Electrician' },
              { id: 5, name: 'Painter' },
              { id: 6, name: 'Locksmith' },
            ]}
            value={value.categoryId}
            onChange={(val) => onChange({ ...value, categoryId: val })}
            labelKey="name"
            valueKey="id"
            placeholder="Select category..."
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location</label>
          <input
            type="text"
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            style={inputStyle}
            placeholder="Nairobi CBD"
            disabled={loading}
          />
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle}>Bio / Description</label>
          <textarea
            value={value.bio}
            onChange={(e) => onChange({ ...value, bio: e.target.value })}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
            placeholder="Brief description of services offered..."
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-glow)',
              borderRadius: '12px',
              padding: '14px 28px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Saving...'
              : mode === 'edit'
              ? 'Update Provider'
              : 'Create Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}