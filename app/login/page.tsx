"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/setup");
    } catch {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    try {
      await signInWithPopup(auth, provider);
      router.push("/setup");
    } catch {
      alert("Google login failed");
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden text-white">

      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black" />

      {/* animated gradient glow */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute w-[900px] h-[900px] bg-gradient-to-r from-purple-700/20 via-pink-600/20 to-red-600/20 rounded-full blur-[100px]"
      />

      {/* particle canvas */}
      <ParticleBackground />

      {/* login card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-[480px] p-10 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >
        <h2 className="text-3xl font-bold text-center mb-8">
          Welcome Back
        </h2>

        {/* google login */}
        <button
          onClick={googleLogin}
          className="w-full py-3 mb-6 rounded-xl bg-white text-black font-medium hover:scale-[1.02] transition"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
          <div className="flex-1 h-[1px] bg-gray-700" />
          or
          <div className="flex-1 h-[1px] bg-gray-700" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">

          <FloatingInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e:any)=>setEmail(e.target.value)}
          />

          <FloatingInput
            label="Password"
            type="password"
            value={password}
            onChange={(e:any)=>setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:scale-[1.03] transition shadow-lg shadow-purple-500/20"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-gray-400 text-sm mt-8 text-center">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300">
            Sign up
          </Link>
        </p>

      </motion.div>
    </div>
  );
}

function FloatingInput({ label, ...props }: any) {
  const [focus, setFocus] = useState(false);

  return (
    <div className="relative">

      <input
        {...props}
        onFocus={() => setFocus(true)}
        onBlur={(e) => setFocus(e.target.value !== "")}
        className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 pt-6 pb-2 focus:border-purple-500 focus:outline-none transition"
      />

      <label
        className={`absolute left-4 transition-all text-gray-400 ${
          focus ? "top-1 text-xs text-purple-400" : "top-3 text-sm"
        }`}
      >
        {label}
      </label>

    </div>
  );
}

function ParticleBackground() {

  const particles = new Array(40).fill(0);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">

      {particles.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: ["0%", "100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className="absolute w-[2px] h-[2px] bg-purple-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

    </div>
  );
}