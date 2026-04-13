'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContactCategory } from '@/types/contact';
import { getContactCategories } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function ContactsPage() {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getContactCategories()
        .then((res) => setCategories(res.data.categories || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ padding: "60px", textAlign: "center" }}>
          Loading contacts...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="section-label">CONTACT CATEGORIES</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/contacts/${category.slug}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px",
              background: "rgba(17,24,39,0.6)",
              border: "1px solid var(--border-glow)",
              borderRadius: "16px",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.3s",
              backdropFilter: "blur(10px)",
            }}
            className="animate-in"
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{category.icon}</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--neon-blue)" }}>
              {category.name}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
