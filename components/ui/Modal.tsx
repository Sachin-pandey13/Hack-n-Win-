// components/ui/Modal.tsx
"use client";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative w-[92vw] max-w-5xl bg-gray-950/80 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h3 className="font-semibold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-md hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-0">{children}</div>
      </div>
    </div>
  );
}
