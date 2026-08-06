import React from "react";
import SandboxCanvas from "../components/SandboxCanvas";

export function SandboxPage() {
  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <SandboxCanvas />
    </div>
  );
}

export default SandboxPage;
