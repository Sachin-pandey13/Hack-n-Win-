"use client";

import { useUsersStore } from "@/store/useUsersStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const user = useUsersStore((s) => s.user);
  const logout = useUsersStore((s) => s.logout);
  const router = useRouter();

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Guest";
  const avatar =
    user?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  async function handleLogout() {
    try {
      await signOut(auth);
      logout();
      router.push("/");
    } catch {
      console.error("Logout failed");
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-6">👤</div>
        <h1 className="text-2xl font-bold text-white mb-3">Not Logged In</h1>
        <p className="text-slate-400 mb-6">
          Please log in to view your profile.
        </p>
        <a
          href="/login"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
        >
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-8 shadow-xl">
        <div className="flex items-center gap-6 mb-8">
          <img
            src={avatar}
            alt="profile"
            className="w-20 h-20 rounded-full border-3 border-purple-500 shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Problems Solved", value: "—", color: "text-emerald-400" },
            { label: "Arena Wins", value: "—", color: "text-indigo-400" },
            { label: "Streak", value: "—", color: "text-amber-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/5 border border-white/10 p-4 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
