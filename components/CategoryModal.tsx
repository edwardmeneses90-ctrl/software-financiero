"use client";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
}

const POPULAR_EMOJIS = [
  // 💰 Dinero / Finanzas
  "💵", "💳", "🏦", "💰", "📈", "📉", "🪙", "💸",
  // 🏠 Hogar / Servicios
  "🏠", "🏢", "⚡", "💧", "🌐", "📱", "🛠️", "🔑",
  // 🛒 Compras / Alimentación
  "🛒", "🍔", "☕", "🥩", "🎁", "📦", "🛍️", "🥐",
  // 🚗 Transporte / Movilidad
  "🚌", "⛽", "🚗", "🚕", "🚂", "🛣️", "🅿️", "🎫",
  // 🏥 Salud / Educación / Personal
  "💊", "🏥", "🎓", "📚", "👨‍👩‍👧", "🐕", "🎬", "🎨",
  // 📝 Otros / Generales
  "📝", "✅", "🔧", "📊", "🎯", "🗓️", "☕", "🌐"
];

export default function CategoryModal({ isOpen, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Ingresa un nombre para la categoría"); return; }
    onSave(name.trim(), icon);
    setName(""); setIcon("📦"); setError(""); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-soft p-6 modal-animate max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">🎨 Nueva Categoría</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Selector de Emoji */}
          <div>
            <label className="text-sm text-secondary mb-2 block font-medium">Icono</label>
            <div className="flex items-center gap-3">
              <span className="text-3xl w-10 h-10 flex items-center justify-center bg-surface-light rounded-lg border border-border">{icon}</span>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                placeholder="Escribe o pega un emoji"
                maxLength={2}
                className="flex-1 bg-surface-light border border-border rounded-xl px-3 py-2 text-primary text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {POPULAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${icon === emoji ? "bg-accent/20 border-2 border-accent scale-110" : "hover:bg-surface-light hover:scale-105"}`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-sm text-secondary mb-1.5 block font-medium">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ej: Mercado, Transporte, Salud..."
              className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
            />
            {error && <p className="text-expense text-xs mt-1.5 animate-pulse font-medium">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-secondary hover:bg-surface-light hover:text-primary transition">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
}