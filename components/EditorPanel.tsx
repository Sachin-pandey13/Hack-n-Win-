"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange } from "@monaco-editor/react";
import "@/app/monaco-local"; 
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  language: "cpp" | "c" | "java" | "python" | string;
  value: string;
  onChange: (next: string) => void;
  height?: string | number;
};

const EditorPanel: React.FC<Props> = ({ language, value, onChange, height = "100%" }) => {
  const handleMount: OnMount = () => {
    // no manual dispose here – wrapper manages it
  };

  const handleChange: OnChange = (val) => onChange(val ?? "");

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height={typeof height === "number" ? `${height}px` : height}
        defaultLanguage={language}
        language={language}
        value={value}
        theme="vs-dark"
        onMount={handleMount}
        onChange={handleChange}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          mouseWheelZoom: true,
        }}
      />
    </div>
  );
};

export default EditorPanel;
