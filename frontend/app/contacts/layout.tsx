'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { href: '/contacts', label: 'All Categories', icon: '📋' },
    { href: '/contacts/landlord', label: 'Landlord', icon: '👑' },
    { href: '/contacts/property-manager', label: 'Property Manager', icon: '🏢' },
    { href: '/contacts/caretaker', label: 'Caretaker', icon: '🔧' },
  ];

  return (
    <div>
      <div className="page-tag">
        📞 CONTACT MANAGEMENT
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab-btn ${pathname === tab.href ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
