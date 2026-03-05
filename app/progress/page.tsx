"use client";
import React from "react";
import ProgressDashboard from "@/components/ProgressDashboard";

export default function ProgressPage() {
  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-bold mb-6">Your Learning Progress</h1>
      <ProgressDashboard />
    </main>
  );
}
