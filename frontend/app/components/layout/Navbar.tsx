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

const isDashboardPage =
  pathname?.startsWith("/dashboard") ||
  pathname?.startsWith("/rentals") ||
  pathname?.startsWith("/payments") ||
  pathname?.startsWith("/ai-insights") ||
  pathname?.startsWith("/settings");

const isHeroPage = mounted && pathname === "/";

  return (
    <nav className="top-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {isDashboardPage && (
          <button
            onClick={toggleSidebar}
            className="menu-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--neon-blue)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Menu size={24} />
          </button>
        )}
        <div className="logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          NEXUSRENT
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
        <button className="btn-purple">List Property</button>
      </div>
    </nav>
  );
}