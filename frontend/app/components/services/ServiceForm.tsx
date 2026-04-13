'use client';

import { useEffect, useState } from 'react';
import { CustomDropdown } from '../ui/CustomDropdown';

interface ServicesFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingProvider?: any;
  loading?: boolean;
}

export function ServiceForm({ onSubmit, onCancel, editingProvider, loading }: ServicesFormProps) {
  const [formData, setFormData] = useState({
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
    if (editingProvider) {
      setFormData({
        name: editingProvider.name || '',
        phone: editingProvider.phone || '',
        email: editingProvider.email || '',
        categoryId: editingProvider.categoryId || '',
        hourlyRate: editingProvider.hourlyRate || '',
        location: editingProvider.location || '',
        bio: editingProvider.bio || '',
        image: editingProvider.image || '',
      });
    }
  }, [editingProvider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "rgba(17,24,39,0.5)",
    border: "1px solid var(--border-glow)",
    borderRadius: "12px",
    padding: "10px 20px",
    fontSize: "16px",
    color: "var(--text-primary)"
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "6px",
    color: "var(--neon-blue)"
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(17,24,39,0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border-glow)",
        borderRadius: "24px",
        padding: "25px",
        maxWidth: "950px",
        marginBottom: "32px"
      }}
    >
      <h3
        style={{
          fontSize: "20px",
          fontWeight: 700,
          background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px"
        }}
      >
        {editingProvider ? "Edit Provider" : "Create New Provider"}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Provider Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="John's Plumbing Services"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
              placeholder="+254 712 345 678"
              required
            />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              placeholder="provider@email.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Rate (Ksh/hr)</label>
            <input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              style={inputStyle}
              placeholder="750"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Service Category *</label>
          <CustomDropdown
    options={[
      { id: 1, name: "Cleaning" },
      { id: 2, name: "Plumbing" },
      { id: 3, name: "Movers" },
      { id: 4, name: "Electrician" },
      { id: 5, name: "Painter" },
      { id: 6, name: "Locksmith" },
    ]}
    value={formData.categoryId}
    onChange={(val) =>
      setFormData({ ...formData, categoryId: val })
    }
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
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            style={inputStyle}
            placeholder="Nairobi CBD"
          />
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle}>Bio / Description</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical"
            }}
            placeholder="Brief description of services offered..."
          />
        </div>

        {/* Actions (MATCHES ROLE FORM) */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {editingProvider ? "Update Provider" : "Create Provider"}
          </button>
        </div>
      </form>
    </div>
  );
}