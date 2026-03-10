// @ts-ignore
"use client";
import { useState, useEffect } from "react";
import { FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import Footer from "../components/layout/Footer";

// ─── Landing / Auth View ──────────────────────────────────────────────────────
export default function LandingView({
  onLogin,
}: {
  onLogin: (provider: string) => void;
}) {
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const { setToken } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('');
  

  const providers = [
    { id: "google", label: "Google", icon: "G", color: "#EA4335" },
  ];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
  setFirstName("");
  setLastName("");
  setEmail("");
  setPassword("");
  setConfirmPassword("");
  setError(null);
}, [isRegister]);

  // ───── Login Handler ─────
const handleLocalLogin = async () => {
  setError(null);
  if (!email || !password) {
    setError("Please fill in both fields.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Login failed.");
      setLoading(false);
      return;
    }
    setToken(data.token, data.user, data.isFirstLogin)
    console.log("Logged in successfully!", data);
    router.push("/dashboard");
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Server error. Try again.");
    setLoading(false);
  }
};

// ───── Register Handler ─────
const handleRegister = async () => {
  setError(null);
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
  setError("Please fill all fields.");
  return;
}

  if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

  setLoading(true);
  try {
    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, lastName, email, password }), 
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Registration failed.");
      setLoading(false);
      return;
    }
    setToken(data.token, data.user, data.isFirstLogin)
    console.log("Registered successfully!", data);
    router.push("/dashboard");
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Server error. Try again.");
    setLoading(false);
  }
};

const inputStyle = {
  flex: 1,
  padding: "11px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(15,22,41,0.8)",
  color: "#E8EDF5",
  fontSize: 14,
  fontFamily: "'Syne', sans-serif",
  outline: "none",
};

const eyeIconStyle = {
  position: "absolute" as const,
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#8A94A6",
  fontSize: 16,
};

return (
  <>
   <div style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    position: "relative",
    zIndex: 1,
    animation: "fadeUp 0.8s ease both"
  }}>
    {/* Logo Top-Center */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #00D4FF 0%, #7B2FFF 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff",
          boxShadow: "0 0 30px rgba(0,212,255,0.35)"
        }}>N</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#E8EDF5", letterSpacing: "-0.5px" }}>NexusRent</div>
          {/* <div style={{ fontSize: 11, color: "#00D4FF", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>ATS OPTIMIZER</div> */}
        </div>
      </div>
    </div>

    {/* Middle Section: Two Columns */}
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: 40,
      flex: 1,
      flexWrap: "wrap", 
      justifyContent: "center",
      alignItems: "center",
      padding: "0 24px", 
    }}>
      {/* Left Column */}
      <div
    style={{
      flex: "1 1 400px", 
      maxWidth: 500, 
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 20,
    }}
  >
    <div
        className="glow-orb"
        style={{
          width: 200,
        height: 200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        marginBottom: 20,
        }}
      />

      {/* Hero left: search & header */}
    <div className="hero-left animate-in">
      <div className="page-tag">◈ RENTAL PLATFORM</div>
      <h1>
        Find <span>Smart Rentals</span>
        <br />
        Near You
      </h1>
      <p>
        Discover properties that match your needs with dynamic listings and
        hyperlocal market insights.
      </p>
    </div>
    </div>
      {/* Right Column */}
<div
  style={{
     flex: "1 1 400px",
      maxWidth: 500,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
  }}
>
  {/* ───── Local Auth Inputs ───── */}
  {!isRegister && (
<>
  <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
  <input
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{
      width: "100%",
      maxWidth: 540,
      padding: "11px 16px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 14,
      fontFamily: "'Syne', sans-serif",
      outline: "none",
      transition: "all 0.2s ease",
    }}
  />
    <FaUser
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8A94A6",
            fontSize: 16,
          }}
        />
  </div>
  <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: "100%",
      maxWidth: 540,
      padding: "11px 16px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 14,
      fontFamily: "'Syne', sans-serif",
      outline: "none",
      transition: "all 0.2s ease",
    }}
  />
    <div
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#8A94A6",
            fontSize: 16,
          }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </div>
  </div>
  </>
  )}

   {/* Firstname + Lastname */}
{isRegister && (
  <>
    {/* Firstname | Lastname */}
    <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 540 }}>
      <input
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        style={inputStyle}
      />
    </div>

    {/* Email */}
    <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ ...inputStyle, width: "100%" }}
      />
    </div>

    {/* Password | Confirm Password */}
    <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 540 }}>

      {/* Password */}
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, width: "100%" }}
        />

        <div
          onClick={() => setShowPassword(!showPassword)}
          style={eyeIconStyle}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </div>
      </div>

      {/* Confirm Password */}
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ ...inputStyle, width: "100%" }}
        />

        <div
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          style={eyeIconStyle}
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </div>
      </div>
    </div>
  </>
)}



  {/* ───── Login/Register Button ───── */}
  <button
    onClick={isRegister ? handleRegister : handleLocalLogin}
    onMouseEnter={() => setHoveredProvider(isRegister ? "register" : "login")}
    onMouseLeave={() => setHoveredProvider(null)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "10px 24px",
      borderRadius: 14,
      border: "1px solid",
      borderColor:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "rgba(0,212,255,0.5)"
          : "rgba(255,255,255,0.08)",
      background:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "rgba(0,212,255,0.06)"
          : "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "'Syne', sans-serif",
      transform:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "translateY(-1px)"
          : "none",
      boxShadow:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "0 8px 24px rgba(0,212,255,0.12)"
          : "none",
      width: "100%",
      maxWidth: 540,
    }}
  >
    {isRegister ? "Register" : "Login"}
  </button>

  {/* ───── Toggle Link ───── */}
  <div
  onClick={() => setIsRegister(!isRegister)}
  style={{
    fontSize: 12,
    cursor: "pointer",
    marginTop: 2,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#8A94A6",
  }}
>
  {isRegister ? (
    <>
      Already have an account?{" "}
      <span style={{ color: "#00D4FF", fontWeight: 600 }}>Login</span>
    </>
  ) : (
    <>
      Don't have an account?{" "}
      <span style={{ color: "#00D4FF", fontWeight: 600 }}>Register</span>
    </>
  )}
</div>

  {/* ───── Error Message ───── */}
  {error && (
    <div style={{ color: "#FF6B6B", fontSize: 12 }}>
      {error}
    </div>
  )}

  {/* ───── Divider ───── */}
  <div
    style={{
      width: 300,
      textAlign: "center",
      color: "#4A5568",
      fontSize: 12,
      margin: "8px 0",
    }}
  >
    ── or continue with ──
  </div>

  {/* ───── OAuth Providers ───── */}
  <div
  style={{
    display: "flex",
    gap: 16,
    justifyContent: "center", // optional
    flexWrap: "wrap", // keeps responsiveness
  }}
>
  {providers.map((p) => (
    <button
      key={p.id}
      onMouseEnter={() => setHoveredProvider(p.id)}
      onMouseLeave={() => setHoveredProvider(null)}
      onClick={() => onLogin(p.id)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "10px 24px",
        borderRadius: 14,
        border: "1px solid",
        borderColor:
          hoveredProvider === p.id
            ? "rgba(0,212,255,0.5)"
            : "rgba(255,255,255,0.08)",
        background:
          hoveredProvider === p.id
            ? "rgba(0,212,255,0.06)"
            : "rgba(15,22,41,0.8)",
        color: "#E8EDF5",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Syne', sans-serif",
        transform: hoveredProvider === p.id ? "translateY(-1px)" : "none",
        boxShadow:
          hoveredProvider === p.id
            ? "0 8px 24px rgba(0,212,255,0.12)"
            : "none",
        width: "auto",
        minWidth: 440,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${p.color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: p.color,
          border: `1px solid ${p.color}30`,
        }}
      >
        {p.icon}
      </span>
      Continue with {p.label}
    </button>
  ))}
  </div>
</div>
    </div>
    <Footer />
  </div>
  </>
);
}
