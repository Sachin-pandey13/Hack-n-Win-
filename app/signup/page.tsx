"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const provider = new GoogleAuthProvider();

  async function signup(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/setup");
    } catch {
      alert("Signup failed");
    }
  }

  async function googleSignup() {
    try {
      await signInWithPopup(auth, provider);
      router.push("/setup");
    } catch {
      alert("Google signup failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white">

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[480px] p-10 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >

        <h2 className="text-3xl font-bold text-center mb-8">
          Create Account
        </h2>

        {/* Google Signup */}
        <button
          onClick={googleSignup}
          className="w-full py-3 mb-6 rounded-xl bg-white text-black font-medium hover:scale-[1.02] transition"
        >
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
          <div className="flex-1 h-[1px] bg-gray-700" />
          or
          <div className="flex-1 h-[1px] bg-gray-700" />
        </div>

        <form onSubmit={signup} className="flex flex-col gap-6">

          <FloatingInput
            label="Email"
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

          <button className="py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:scale-[1.03] transition shadow-lg shadow-purple-500/20">
            Create Account
          </button>

        </form>

        <p className="text-gray-400 text-sm mt-8 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Login
          </Link>
        </p>

      </motion.div>

    </div>
  );
}


/* Floating input */
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