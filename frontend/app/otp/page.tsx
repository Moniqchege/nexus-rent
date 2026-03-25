// @ts-ignore
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function OTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      router.push("/reset-password?email=" + encodeURIComponent(email || ""));
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!email) {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", background: "linear-gradient(135deg, #0f1629 0%, #1a233d 100%)", color: "#E8EDF5" }}>
        <div style={{ maxWidth: 540, width: "100%" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
            Verify OTP
          </h1>
          <p style={{ color: "#8A94A6", marginBottom: 32 }}>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              style={{
                width: "100%",
                padding: "20px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15,22,41,0.8)",
                color: "#E8EDF5",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "6px",
                textAlign: "center",
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 24,
              background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => router.push("/reset-password")}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 12,
              background: "transparent",
              color: "#00d4ff",
              border: "1px solid #00d4ff",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Reset Password
          </button>
          {error && (
            <div style={{ color: "#FF6B6B", fontSize: 14, marginTop: 16, textAlign: "center" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ color: "#00d4ff", fontSize: 14, marginTop: 16, textAlign: "center" }}>
              {message}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

