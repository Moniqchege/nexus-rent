'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Contact } from '@/types/contact';
import { useAuthStore } from '@/app/store/authStore';
import SearchBar from '@/app/components/ui/SearchBar';
import { getContacts } from '@/app/lib/api';

export default function ContactsDetailPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const router = useRouter();
  const { token } = useAuthStore();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState(1);

  useEffect(() => {
    if (token && propertyId) {
      getContacts(propertyId)
        .then((res) => {
          const allContacts = res.data.contacts || [];
          const filtered = allContacts.filter((c: Contact) => c.type === slug);
          setContacts(filtered);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, propertyId, slug]);

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ padding: "60px", textAlign: "center" }}>
          Loading {slug.replace('-', ' ').toUpperCase()} contacts...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-label">{slug.toUpperCase().replace('-', ' ')}</div>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search contacts..."
      />

      {filteredContacts.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              <th style={{ padding: "12px" }}>Name</th>
              <th style={{ padding: "12px" }}>Phone</th>
              <th style={{ padding: "12px" }}>Email</th>
              <th style={{ padding: "12px" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id} style={{ borderBottom: "1px solid var(--border-glow)", backgroundColor: "rgba(17,24,39,0.8)" }}>
                <td style={{ padding: "12px", color: "var(--neon-secondary)" }}>
                  {contact.name}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {contact.phone || '-'}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {contact.email || '-'}
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>
                  {contact.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            No contacts found for {slug.replace('-', ' ')}
          </div>
          <p style={{ fontSize: "14px" }}>
            Contacts will appear here once assigned to your property
          </p>
        </div>
      )}
    </div>
  );
}
