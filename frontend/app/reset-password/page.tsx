// @ts-ignore
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState("email"); // email | otp | password
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

  const inputStyle = {
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
  };

  const eyeStyle = {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)" as const,
    cursor: "pointer",
    color: "#8A94A6",
    fontSize: 16,
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", background: "linear-gradient(135deg, #0f1629 0%, #1a233d 100%)", color: "#E8EDF5" }}>
        <div style={{ maxWidth: 540, width: "100%" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
            {step === "email" && "Reset Password"}
            {step === "otp" && "Enter OTP"}
            {step === "password" && (firstLogin ? "Set New Password" : "New Password")}
          </h1>
          <p style={{ color: "#8A94A6", marginBottom: 32, lineHeight: 1.6 }}>
            {step === "email" && "Enter your email to receive OTP"}
            {step === "otp" && "Check your email for 6-digit code"}
            {step === "password" && "Choose a strong password"}
          </p>

          {step === "email" && (
            <div>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
                <FaUser style={eyeStyle} />
              </div>
              <button
                onClick={sendOTP}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
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
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                style={{
                  width: "100%",
                  padding: "14px",
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
                onClick={() => setStep("email")}
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
                Resend OTP
              </button>
            </div>
          )}

          {step === "password" && (
            <div>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
                <div onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
                <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeStyle}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <button
                onClick={changePassword}
                disabled={loading || password !== confirmPassword || !password}
                style={{
                  width: "100%",
                  padding: "14px",
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
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}

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

