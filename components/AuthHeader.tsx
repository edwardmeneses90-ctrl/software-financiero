"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="fixed top-4 right-4 z-50">
      <button
        onClick={handleLogout}
        disabled={loading}
        className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-expense hover:bg-expense/5 transition-all shadow-soft"
        title="Cerrar Sesión"
      >
        {/* 🚪 Icono siempre visible, pequeño y limpio */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </header>
  );
}