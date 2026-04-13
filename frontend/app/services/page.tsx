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

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50];

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
  setPageIndex(0);
}, [search]);

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

const totalElements = filteredProviders.length;
const totalPages = Math.ceil(totalElements / pageSize);

const pageStart = totalElements === 0 ? 0 : pageIndex * pageSize + 1;
const pageEnd = Math.min((pageIndex + 1) * pageSize, totalElements);

const paginatedProviders = filteredProviders.slice(
  pageIndex * pageSize,
  pageIndex * pageSize + pageSize
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
            {paginatedProviders.map((provider, index) => (
              <tr
                key={provider.id}
                style={{
                  borderBottom: "1px solid var(--border-glow)",
                  backgroundColor: "rgba(17,24,39,0.8)",
                }}
              >
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {pageIndex * pageSize + index + 1}
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

      {totalElements > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "12px 16px",
      borderTop: "1px solid var(--border-glow)",
      marginTop: "16px",
      backgroundColor: "rgba(17,24,39,0.6)",
      backdropFilter: "blur(10px)",
    }}
  >
    {/* LEFT: Results summary */}
    <div style={{ flex: 1 }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
        Showing{" "}
        <span style={{ color: "var(--neon-secondary)", fontWeight: 600 }}>
          {pageStart}
        </span>
        –
        <span style={{ color: "var(--neon-secondary)", fontWeight: 600 }}>
          {pageEnd}
        </span>{" "}
        of{" "}
        <span style={{ color: "var(--neon-secondary)", fontWeight: 600 }}>
          {totalElements}
        </span>
      </span>
    </div>

    {/* RIGHT: Controls */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "18px",
        flex: 1,
      }}
    >
      {/* Page size selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          Items Per Page:
        </span>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPageIndex(0);
          }}
          style={{
            padding: "6px 10px",
            borderRadius: "10px",
            border: "1px solid var(--border-glow)",
            backgroundColor: "rgba(17,24,39,0.8)",
            color: "var(--text-primary)",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Pager */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Prev */}
        <button
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          disabled={pageIndex === 0}
          style={{
            padding: "6px 15px",
            borderRadius: "10px",
            border: "1px solid var(--border-glow)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "var(--neon-blue)",
            cursor: pageIndex === 0 ? "not-allowed" : "pointer",
            opacity: pageIndex === 0 ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          ‹
        </button>

        {/* Current page */}
        <div
          style={{
            padding: "4px 15px",
            borderRadius: "10px",
            border: "1px solid var(--neon-blue)",
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))",
            color: "var(--neon-blue)",
            // fontWeight: 600,
            // minWidth: "8px",
            textAlign: "center",
          }}
        >
          {pageIndex + 1}
        </div>

        {/* Next */}
        <button
          onClick={() =>
            setPageIndex((p) => Math.min(totalPages - 1, p + 1))
          }
          disabled={pageIndex >= totalPages - 1}
          style={{
            padding: "6px 15px",
            borderRadius: "10px",
            border: "1px solid var(--border-glow)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "var(--neon-blue)",
            cursor:
              pageIndex >= totalPages - 1 ? "not-allowed" : "pointer",
            opacity: pageIndex >= totalPages - 1 ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          ›
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}