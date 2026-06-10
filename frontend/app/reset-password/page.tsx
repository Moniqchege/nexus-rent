// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import { Lock, KeyRound, ArrowLeft } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const firstLogin = searchParams.get("firstLogin") === "true";

  const sendOTP = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: firstLogin ? "firstLogin" : "reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("OTP sent to your email");
      setStep("otp");
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError("OTP is required");
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
      setStep("password");
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (!password || password !== confirmPassword) {
      setError("Passwords must match and not empty");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("Password changed successfully");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px 12px 44px",
    borderRadius: 10,
    border: "1px solid var(--border-glow)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.2s",
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: 480,
    width: "100%",
    background: "var(--bg-card)",
    border: "1px solid var(--border-glow)",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: "center",
    color: "var(--text-primary)",
  };

  const subtextStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    marginBottom: 24,
    textAlign: "center",
    fontSize: 14,
  };

  const errorStyle: React.CSSProperties = {
    background: "rgba(220, 38, 38, 0.08)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "var(--accent-danger)",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  };

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
        <div style={cardStyle}>
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
              {step === "email" && <FaUser size={24} />}
              {step === "otp" && <KeyRound size={26} />}
              {step === "password" && <Lock size={26} />}
            </div>
          </div>
          <div className="section-label" style={{ textAlign: "center" }}>
            {step === "email" && "RESET PASSWORD"}
            {step === "otp" && "ENTER OTP"}
            {step === "password" && (firstLogin ? "SET NEW PASSWORD" : "NEW PASSWORD")}
          </div>
          <h1 style={headingStyle}>
            {step === "email" && "Reset Password"}
            {step === "otp" && "Enter OTP"}
            {step === "password" && (firstLogin ? "Set New Password" : "New Password")}
          </h1>
          <p style={subtextStyle}>
            {step === "email" && "Enter your email to receive OTP"}
            {step === "otp" && "Check your email for 6-digit code"}
            {step === "password" && "Choose a strong password"}
          </p>

          {step === "email" && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <FaUser
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                className="btn-primary"
                onClick={sendOTP}
                disabled={loading}
                style={{ width: "100%", padding: "12px", fontSize: 14 }}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <KeyRound
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  style={{ ...inputStyle, letterSpacing: 6, textAlign: "center" }}
                />
              </div>
              <button
                className="btn-primary"
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                style={{ width: "100%", padding: "12px", fontSize: 14 }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={() => setStep("email")}
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
                <ArrowLeft size={14} /> Resend OTP
              </button>
            </div>
          )}

          {step === "password" && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                  }}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <div
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={changePassword}
                disabled={loading || password !== confirmPassword || !password}
                style={{ width: "100%", padding: "12px", fontSize: 14 }}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}

          {error && <div style={errorStyle}>{error}</div>}
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
