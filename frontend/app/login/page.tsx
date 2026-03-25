// @ts-ignore
"use client";
import { useState } from "react";
import { FaUser, FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import "../login/theme.css";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function LoginPage() {
  const { setToken } = useAuthStore();
  const router = useRouter();

  // ───── States ─────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
  minLength: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
});

const validatePassword = (pwd: string) => {
  setPasswordCriteria({
    minLength: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  });
};

  // OTP / First-login states
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Step 1: Login
  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        setLoading(false);
        return;
      }

      // ✅ Check first login first
      if (data.user.firstLogin) {
        setUserId(data.user.id);
        setFirstLogin(true);
        sessionStorage.setItem("token", data.token); 
        
        setLoading(false);
        return;
        
      }

      // Normal login, trigger OTP
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setUserId(data.userId);
      }

    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || !userId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:4000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "OTP verification failed.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("token", data.token);
      // ✅ Pass all expected args
      setToken(
        data.token,
        data.user, 
        data.isFirstLogin
      );

      if (!data.isFirstLogin) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: First-login password reset
  const handleFirstLoginReset = async () => {
    if (!newPassword || !userId) return;
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token"); 
      const res = await fetch("http://localhost:4000/auth/reset-first-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Password reset failed.");
        setLoading(false);
        return;
      }

      setFirstLogin(false);

      // ✅ Now login again to generate OTP with the new password
      const otpRes = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        setError(otpData.message || "OTP request failed.");
        setLoading(false);
        return;
      }

      setRequiresOtp(true);
      setUserId(otpData.userId);

    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <Navbar />
        
        <div className="login-hero">
          {/* Left Hero Content */}
          <div className="login-left">
            <div className="login-glow" />
            <div className="hero-left">
              <div className="page-tag">◈ NEXUS ACCESS</div>
              <h1 className="section-title">
                Secure <span>Entry</span> Required
              </h1>
              <p className="animate-in delay-2">
                Enter your credentials to access the Nexus rental platform. Two-factor authentication keeps your account secure.
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="login-card">
            <div className="login-card-inner">
            {!requiresOtp && !firstLogin && (
              <>
                <div className="section-label">Credentials</div>
                {/* Email */}
                <div className="login-input-group">
                  <FaUser className="login-input-icon" />
                  <input
                    className="login-input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                </div>

                {/* Password */}
                <div className="login-input-group">
                  <FaLock className="login-input-icon" />
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div 
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>

                <button
                  className="login-btn"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Access Nexus"}
                </button>
              </>
            )}

            {/* OTP Verification */}
            {!firstLogin && requiresOtp && (
              <div className="otp-section">
                <div className="section-label">Verification</div>
                <div className="login-input-group">
                  <FaShieldAlt className="login-input-icon" />
                  <input
                    className="login-input"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <button 
                  className="login-btn"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Confirm Access"}
                </button>
              </div>
            )}

            {/* First Login Password Reset */}
            {firstLogin && (
              <div className="otp-section">
                <div className="section-label">First Access</div>
                <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', textAlign: 'center'}}>
                  Set your secure password to complete first-time setup.
                </p>
                <div className="login-input-group">
  <FaShieldAlt className="login-input-icon" />
  <input
    className="login-input"
    type={showNewPassword ? "text" : "password"}  // use new toggle
    placeholder="Create new password"
    value={newPassword}
    onChange={(e) => {
      setNewPassword(e.target.value);
      validatePassword(e.target.value);
    }}
  />
  <div 
    className="login-password-toggle"
    onClick={() => setShowNewPassword(!showNewPassword)}
  >
    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
  </div>
</div>
                <div className="password-strength">
  <p>Password must contain:</p>
  <ul>
    <li className={passwordCriteria.minLength ? "valid" : ""}>
      <FaCheckCircle /> Minimum 8 characters
    </li>
    <li className={passwordCriteria.uppercase ? "valid" : ""}>
      <FaCheckCircle /> At least one uppercase letter
    </li>
    <li className={passwordCriteria.lowercase ? "valid" : ""}>
      <FaCheckCircle /> At least one lowercase letter
    </li>
    <li className={passwordCriteria.number ? "valid" : ""}>
      <FaCheckCircle /> At least one number
    </li>
    <li className={passwordCriteria.special ? "valid" : ""}>
      <FaCheckCircle /> At least one special character
    </li>
  </ul>
</div>
                <button 
                  className="login-btn"
                  onClick={handleFirstLoginReset}
                  disabled={loading || !Object.values(passwordCriteria).every(Boolean)}
                >
                  {loading ? "Securing..." : "Set Password"}
                </button>
              </div>
            )}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}
          </div>
        </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}

