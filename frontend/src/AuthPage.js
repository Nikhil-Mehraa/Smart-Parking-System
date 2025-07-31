import React, { useState } from "react";

// Example royalty-free parking image
const PARKING_BG =
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1470&q=80";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSignUp(e) {
    e.preventDefault();
    if (!email || !password) return setError("Enter all fields");
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[email]) return setError("Email already registered");
    users[email] = password;
    localStorage.setItem("users", JSON.stringify(users));
    setMode("signin");
    setError("Sign up successful! Please sign in.");
    setEmail("");
    setPassword("");
  }

  function handleSignIn(e) {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (!users[email]) return setError("User not found");
    if (users[email] !== password) return setError("Wrong password");
    localStorage.setItem("currentUser", email);
    onAuthSuccess();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: `url('${PARKING_BG}') center/cover no-repeat fixed`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        className="auth-card"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderRadius: "24px",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.13),0 2px 6px rgba(255,255,255,0.16)",
          padding: "40px 38px",
          width: "100%",
          maxWidth: "400px",
          zIndex: 2,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#1976d2",
            marginBottom: "12px",
          }}
        >
          Owner Parking Dashboard
        </h2>
        <div style={{ marginBottom: 18, color: "#444", fontSize: "1.11em" }}>
          <strong>This portal is for Parking Lot Owners/Admins only.</strong>
          <br />
          <span>Sign in to access owner features: bulk bookings, dynamic pricing, and analytics.</span>
        </div>
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          <input
            type="email"
            placeholder="Owner Email"
            value={email}
            autoComplete="username"
            onChange={e => setEmail(e.target.value)}
            style={{
              marginBottom: "15px",
              width: "100%",
              padding: "13px",
              borderRadius: "6px",
              border: "1px solid #bbb",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            onChange={e => setPassword(e.target.value)}
            style={{
              marginBottom: "15px",
              width: "100%",
              padding: "13px",
              borderRadius: "6px",
              border: "1px solid #bbb",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              margin: "10px 0",
              background:
                "linear-gradient(90deg, #1976d2 35%, #2196f3 100%)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1.08em",
              borderRadius: "7px",
              padding: "12px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(30,60,90,0.08)",
            }}
          >
            {mode === "signin" ? "Sign in as Owner" : "Sign up (Owner only)"}
          </button>
        </form>
        <button
          className="toggle-mode"
          style={{
            marginTop: "5px",
            color: "#1976d2",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1em",
          }}
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
        >
          {mode === "signin"
            ? "Create Owner Account"
            : "Back to Owner Sign in"}
        </button>
        {error && (
          <div
            className="status-message"
            style={{
              color:
                error.includes("success") || error.includes("Success")
                  ? "#2e7d32"
                  : "#d32f2f",
              marginTop: "14px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}
      </div>
      {/* Optional dark overlay for readability */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(120deg,rgba(0,0,0,0.15) 0%,rgba(33,150,243,0.09) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
