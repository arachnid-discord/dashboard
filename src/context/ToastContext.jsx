import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast } from "../components/ui";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const push = useCallback((t) => {
    setToast(t);
    window.clearTimeout(push._timer);
    push._timer = window.setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
