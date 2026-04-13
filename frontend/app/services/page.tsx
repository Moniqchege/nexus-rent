'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { ServiceProvider } from '@/types/service';
import SearchBar from '../components/ui/SearchBar';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function ServiceLendersPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await api.get('/api/services/providers');
      setProviders(res.data.providers || []);
    } catch (error) {
      console.error('Load providers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    router.push('/services/new');
  };

  const handleEdit = (id: number) => {
    router.push(`/services/edit/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId === null) return;

    try {
      await api.delete(`/api/services/providers/${selectedId}`);
      setProviders(providers.filter(p => p.id !== selectedId));
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDialogOpen(false);
      setSelectedId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  const filteredProviders = providers.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ padding: "60px", textAlign: "center" }}>
          Loading service lenders...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="page-tag">🏦 SERVICE LENDERS</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="section-label">PROVIDERS MANAGEMENT</div>

        <button
          onClick={handleAdd}
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
          + New Provider
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Providers
        </h2>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search providers..."
      />

      {providers.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
              <th>#</th>
              <th style={{ padding: "12px" }}>Name</th>
              <th style={{ padding: "12px" }}>Category</th>
              <th style={{ padding: "12px" }}>Contact</th>
              <th style={{ padding: "12px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProviders.map((provider, index) => (
              <tr
                key={provider.id}
                style={{
                  borderBottom: "1px solid var(--border-glow)",
                  backgroundColor: "rgba(17,24,39,0.8)",
                }}
              >
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {index + 1}
                </td>

                <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                  {provider.name || "-"}
                </td>

                <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {provider.category?.name || "-"}
                </td>

                <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {provider.phone || provider.email || "-"}
                </td>

                <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                  <button
                    className="action-btn"
                    onClick={() => handleEdit(provider.id)}
                  >
                    View
                  </button>

                  <button
                    className="action-btn"
                    onClick={() => handleEdit(provider.id)}
                  >
                    Edit
                  </button>

                  <button
                    className="action-btn"
                    onClick={() => handleDeleteClick(provider.id)}
                  >
                    Delete
                  </button>

                  <ConfirmDialog
                    open={dialogOpen}
                    title="Delete Provider"
                    message="Are you sure you want to delete this provider? This action cannot be undone."
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            padding: "80px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            🏦 No service providers
          </div>

          <p style={{ fontSize: "14px" }}>
            Add your first provider to get started
          </p>

          <button
            onClick={handleAdd}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px 32px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "14px",
            }}
          >
            Add First Provider
          </button>
        </div>
      )}
    </div>
  );
}