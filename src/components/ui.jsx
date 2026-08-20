import React from "react";
import { Loader2 } from "lucide-react";

export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-[13px] text-white/40 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className = "w-5 h-5" }) {
  return <Loader2 className={`${className} animate-spin text-[#00b8ff]`} />;
}

export function LoadingScreen({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-white/40 text-sm">
      <Spinner className="w-6 h-6" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-[13px] px-4 py-3">
      {message}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border text-[13px] shadow-xl backdrop-blur-xl transition-all ${
        isError
          ? "bg-red-500/10 border-red-500/30 text-red-300"
          : "bg-[#00b8ff]/10 border-[#00b8ff]/30 text-[#00b8ff]"
      }`}
    >
      {toast.message}
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  const variants = {
    primary: "bg-[#00b8ff] hover:bg-[#00b8ff]/80 text-black font-medium",
    secondary: "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08]",
    danger: "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30",
    ghost: "hover:bg-white/[0.06] text-white/60 hover:text-white",
    discord: "bg-[#5865f2] hover:bg-[#5865f2]/80 text-white font-medium",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2.5 cursor-pointer group">
      <div>
        <div className="text-[13px] text-white/80 group-hover:text-white transition-colors">
          {label}
        </div>
        {description && <div className="text-[12px] text-white/30 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${
          checked ? "bg-[#00b8ff]" : "bg-white/[0.1]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function Field({ label, help, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {help && <p className="text-[12px] text-white/30">{help}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-[#0d0e12] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-[#00b8ff]/50 transition-colors";

export function TextInput(props) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />;
}

export function NumberInput(props) {
  return <input type="number" {...props} className={`${inputClass} ${props.className || ""}`} />;
}

export function TextArea(props) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`${inputClass} resize-y ${props.className || ""}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputClass} ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: "text-white/50 border-white/15 bg-white/[0.04]",
    accent: "text-[#00b8ff] border-[#00b8ff]/30 bg-[#00b8ff]/10",
    green: "text-green-400 border-green-500/30 bg-green-500/10",
    red: "text-red-400 border-red-500/30 bg-red-500/10",
    yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  };
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="text-center py-12 text-white/30 text-[13px]">{children}</div>
  );
}
