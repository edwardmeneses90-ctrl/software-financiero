"use client";
import { useState, useEffect } from "react";

interface EditData {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { type: string; category: string; amount: number; date: string }) => Promise<void>;
  initialData: EditData | null;
  categories: string[];
}

export default function EditTransactionModal({ isOpen, onClose, onSave, initialData, categories }: Props) {
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pre-llenar campos al abrir
  useEffect(() => {
    if (isOpen && initialData) {
      setType(initialData.type);
      setCategory(initialData.category);
      setDate(initialData.date);
      
      // Formatear monto para edición (ej: 1234.56 -> 1.234,56)
      const clean = initialData.amount.toString().replace(/\./g, "").replace(",", ".");
      const parts = clean.split(".");
      const formattedInt = (parts[0] || "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setAmount(parts.length > 1 ? `${formattedInt},${parts[1].slice(0, 2)}` : formattedInt);
      
      setError("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const cleanAmount = amount.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleanAmount);

    if (!type || !category || isNaN(num) || num <= 0 || !date) {
      setError("Completa todos los campos correctamente");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(initialData!.id, { type, category, amount: num, date });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar el registro");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-soft p-6 modal-animate">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">✏️ Editar Movimiento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Selector Tipo */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("income")} className={`flex-1 py-2.5 rounded-xl border transition-all ${type === "income" ? "bg-income/10 border-income/40 text-income" : "border-border text-secondary hover:bg-surface-light"}`}>
              🟢 Ingreso
            </button>
            <button type="button" onClick={() => setType("expense")} className={`flex-1 py-2.5 rounded-xl border transition-all ${type === "expense" ? "bg-expense/10 border-expense/40 text-expense" : "border-border text-secondary hover:bg-surface-light"}`}>
              🔴 Egreso
            </button>
          </div>

          {/* Categoría */}
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition cursor-pointer">
            <option value="" disabled>Selecciona categoría</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Monto */}
          <div className="flex items-center bg-surface-light border border-border rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
            <span className="text-primary font-semibold mr-1 select-none">$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              value={amount} 
              onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} 
              placeholder="0.00" 
              className="w-full bg-transparent text-primary outline-none" 
            />
          </div>

          {/* Fecha */}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition cursor-pointer" />

          {error && <p className="text-expense text-xs text-center animate-pulse font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-secondary hover:bg-surface-light hover:text-primary transition">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}