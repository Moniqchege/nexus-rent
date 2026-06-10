// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";
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
      <main
        style={{
          minHeight: "calc(100vh - 64px - 70px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 16px",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glow)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--neon-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={28} />
            </div>
          </div>
          <div className="section-label" style={{ textAlign: "center" }}>
            VERIFICATION
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
              textAlign: "center",
              color: "var(--text-primary)",
            }}
          >
            Verify OTP
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: 24,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "1px solid var(--border-glow)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "8px",
                textAlign: "center",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            className="btn-primary"
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 16,
              fontSize: 14,
              opacity: loading || otp.length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => router.push("/reset-password")}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 10,
              background: "transparent",
              color: "var(--neon-blue)",
              border: "1px solid var(--border-glow)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Back to Reset Password
          </button>
          {error && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "var(--accent-danger)",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              style={{
                color: "var(--accent-success)",
                fontSize: 13,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {message}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
