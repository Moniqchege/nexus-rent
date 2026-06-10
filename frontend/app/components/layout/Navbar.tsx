"use client";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useUIStore } from "@/app/store/uiStore";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect

  const isDashboardPage =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/my-rentals") ||
    pathname?.startsWith("/payments") ||
    pathname?.startsWith("/leases") ||
    pathname?.startsWith("/properties") ||
    pathname?.startsWith("/notifications") ||
    pathname?.startsWith("/roles") ||
    pathname?.startsWith("/services") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/contacts");

  const isHeroPage = mounted && pathname === "/";

  return (
    <nav className="top-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isDashboardPage && (
          <button
            onClick={toggleSidebar}
            className="menu-btn"
            aria-label="Toggle sidebar"
            style={{
              background: "transparent",
              border: "1px solid var(--border-glow)",
              borderRadius: 8,
              padding: 6,
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <div
          className="logo"
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        >
          NEXUS RENT
        </div>
      </div>
      <div className="nav-actions">
        {isHeroPage && (
          <button
            className="btn-primary"
            onClick={() => router.push("/login")}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
