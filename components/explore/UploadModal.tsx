"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Video, Hash, FileText, CheckCircle2, UserCircle2 } from "lucide-react";
import { saveTutorUpload } from "@/lib/userUploads";

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  defaultSubField,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  defaultSubField?: string | null;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtubeLink: "",
    topics: "",
    provider: "Tutor",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Parse youtube link to get ID
    let videoId = "dQw4w9WgXcQ"; // fallback rickroll
    try {
      const url = new URL(formData.youtubeLink);
      if (url.hostname.includes("youtube.com")) {
        videoId = url.searchParams.get("v") || videoId;
      } else if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      }
    } catch (e) {}

    setTimeout(() => {
      saveTutorUpload({
        title: formData.title,
        description: formData.description,
        provider: formData.provider,
        youtube: { kind: "video", videoId },
        topics: formData.topics.split(",").map((t) => t.trim()).filter(Boolean),
        language: "English",
        level: "Beginner",
        category: "Technical",
        subject: defaultSubField || "Computer Science",
        stream: "CSE",
        uploaderName: formData.provider || "Community Tutor",
      });

      setIsSubmitting(false);
      setStep(2);
      setTimeout(() => {
        setStep(1);
        setFormData({ title: "", description: "", youtubeLink: "", topics: "", provider: "Tutor" });
        onClose();
        if (onUploadSuccess) onUploadSuccess();
      }, 2000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
              {/* Glow effects */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-purple-500/20 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-500/20 blur-[80px]" />

              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>

              {step === 1 ? (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Share Your Knowledge</h2>
                      <p className="text-sm text-gray-400">Upload as a Tutor to Elysium</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Video size={16} /> YouTube Video Link
                      </label>
                      <input
                        required
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.youtubeLink}
                        onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <UserCircle2 size={16} /> Your Tutor Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Code Master Jane"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <FileText size={16} /> Video Title
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Mastering Dynamic Programming in 1 Hour"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Hash size={16} /> Topics (Comma separated)
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="DSA, Dynamic Programming, Placement"
                        value={formData.topics}
                        onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 flex mx-1 text-sm font-medium text-gray-300">
                        Short Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="In this tutorial, we will cover..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <Upload size={18} /> Publish Video
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">Upload Successful!</h2>
                  <p className="mt-2 text-gray-400">Your video is now live on Elysium.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
