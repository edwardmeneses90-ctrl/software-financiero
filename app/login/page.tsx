"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [cedula, setCedula] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm glass rounded-2xl p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-center text-primary mb-2">🔒 Acceso Seguro</h1>
        <p className="text-secondary text-center text-sm mb-6">Ingresa tu cédula y PIN para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={cedula}
            onChange={e => setCedula(e.target.value.replace(/\D/g, ""))}
            placeholder="Cédula"
            required
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN de acceso"
            required
            maxLength={6}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
          />
          
          {error && <p className="text-expense text-xs text-center animate-pulse font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-glow"
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </button>
        </form>
        
        <p className="text-muted text-xs text-center mt-6">Sesión segura. Se cierra al salir del navegador.</p>
      </div>
    </main>
  );
}