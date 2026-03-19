"use client";

import { useState } from "react";
import { db, auth } from "@/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./signup.css"; 

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Signup successful");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
  <div className="signup-container">
    <div className="signup-card">
      
      <h1 className="signup-title">Sign Up</h1>

      <input
        className="signup-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="signup-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="signup-button" onClick={handleSignup}>
        Create Account
      </button>

      <p style={{ textAlign: "center", marginTop: "10px" }}>
        Already have an account? <a href="/login">Login</a>
      </p>

    </div>
  </div>
);
}