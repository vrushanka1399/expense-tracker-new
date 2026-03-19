"use client";

import { useState } from "react";
import { db, auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
  <div className="login-container">
    <div className="login-card">
      
      <h1 className="login-title">Login</h1>

      <input
        className="login-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="login-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="login-button" onClick={handleLogin}>
        Login
      </button>

      <p style={{ textAlign: "center", marginTop: "15px" }}>
      Don’t have an account?{" "}
      <a href="/signup" style={{ color: "#007bff", fontWeight: "500" }}>
      Sign up
      </a>
      </p>

    </div>
  </div>
);
}