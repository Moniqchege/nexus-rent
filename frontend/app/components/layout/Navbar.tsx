"use client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav>
      <div className="logo">NEXUSRENT</div>
      <div className="nav-actions">
        <button
          className="btn-primary"
          onClick={() => router.push("/login")} 
        >
          Sign In
        </button>
        <button className="btn-purple">List Property</button>
      </div>
    </nav>
  );
}