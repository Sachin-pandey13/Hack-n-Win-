"use client";
import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";

export default function ResizeHandle({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <PanelResizeHandle
      className={`rp-Handle ${className}`}
      {...props}
    >
      <div className="rp-HandleInset">
        <div className="rp-HandleDot" />
      </div>
    </PanelResizeHandle>
  );
}
