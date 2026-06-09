"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CheckItem {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  is_completed: boolean;
}

interface Props {
  year: number;
  month: number;
  isReadOnly?: boolean;
}

export default function MonthlyChecklist({ year, month, isReadOnly = false }: Props) {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("checklist_items").select("*").eq("year", year).eq("month", month).order("type", { ascending: true }).order("title", { ascending: true });
      if (!cancelled) { if (error) console.error("Error cargando checklist:", error); else setItems(data as CheckItem[] || []); setIsLoading(false); }
    };
    fetchItems();
    return () => { cancelled = true; };
  }, [year, month]);

  const toggleItem = async (id: string, current: boolean) => {
    if (isReadOnly) return;
    const { error } = await supabase.from("checklist_items").update({ is_completed: !current }).eq("id", id);
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, is_completed: !current } : i));
  };

  const deleteItem = async (id: string) => {
    if (isReadOnly || !window.confirm("¿Eliminar este ítem?")) return;
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddItem = async () => {
    if (isReadOnly || !formTitle.trim()) { setFormError("Ingresa un título o concepto"); return; }
    const cleanAmount = formAmount.replace(/\./g, "").replace(",", ".");
    const amountNum = parseFloat(cleanAmount);
    if (isNaN(amountNum) || amountNum <= 0) { setFormError("Ingresa un monto válido mayor a $0"); return; }

    setIsSaving(true); setFormError("");
    const { error } = await supabase.from("checklist_items").insert({ year, month, title: formTitle.trim(), amount: amountNum, type: formType, is_completed: false });
    setIsSaving(false);
    if (error) { setFormError("Error al guardar: " + error.message); }
    else { setFormTitle(""); setFormAmount(""); setFormType("expense"); setIsAddModalOpen(false); const { data } = await supabase.from("checklist_items").select("*").eq("year", year).eq("month", month).order("type", { ascending: true }); setItems(data as CheckItem[] || []); }
  };

  const incomes = items.filter(i => i.type === "income");
  const expenses = items.filter(i => i.type === "expense");
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, i) => sum + i.amount, 0);
  const completedExp = expenses.filter(i => i.is_completed).reduce((s, i) => s + i.amount, 0);
  const progress = totalExpense > 0 ? Math.round((completedExp / totalExpense) * 100) : 0;

  if (isLoading) return <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" /><p className="text-secondary text-sm">Cargando checklist...</p></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">✅ Checklist {month.toString().padStart(2, "0")}/{year}</h2>
          <p className="text-secondary text-sm">Agrega tus ítems y márcalos al cumplirlos</p>
        </div>
        {!isReadOnly && (
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition flex items-center gap-2 shadow-glow">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Agregar Ítem
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4 shadow-soft">
          <span className="text-5xl">📝</span>
          <p className="text-secondary text-lg">{isReadOnly ? "No hay ítems en este mes" : "Aún no hay ítems para este mes"}</p>
          <p className="text-muted text-sm">{isReadOnly ? "Los datos históricos se muestran en modo solo lectura" : "Haz clic en 'Agregar Ítem' para empezar a construir tu lista"}</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-secondary">Progreso de pagos</span><span className="font-medium text-primary">{progress}%</span></div>
            <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-income to-accent transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="flex justify-between text-xs text-muted"><span>Pendiente: {fmt(totalExpense - completedExp)}</span><span>Completado: {fmt(completedExp)}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-income flex items-center gap-2">💰 Entradas <span className="text-sm text-muted font-normal">({fmt(totalIncome)})</span></h3>
              {incomes.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.is_completed ? "bg-income/10 border-income/30" : "bg-surface border-border"}`}>
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input type="checkbox" checked={item.is_completed} onChange={() => toggleItem(item.id, item.is_completed)} disabled={isReadOnly} className="w-5 h-5 rounded border-border text-income focus:ring-income/30 cursor-pointer disabled:opacity-50" />
                    <span className={`font-medium ${item.is_completed ? "text-income line-through opacity-80" : "text-primary"}`}>{item.title}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${item.is_completed ? "text-income/70" : "text-income"}`}>{fmt(item.amount)}</span>
                    {!isReadOnly && <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-expense transition" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-expense flex items-center gap-2">📉 Salidas <span className="text-sm text-muted font-normal">({fmt(totalExpense)})</span></h3>
              {expenses.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.is_completed ? "bg-expense/10 border-expense/30" : "bg-surface border-border"}`}>
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input type="checkbox" checked={item.is_completed} onChange={() => toggleItem(item.id, item.is_completed)} disabled={isReadOnly} className="w-5 h-5 rounded border-border text-expense focus:ring-expense/30 cursor-pointer disabled:opacity-50" />
                    <span className={`font-medium ${item.is_completed ? "text-expense line-through opacity-80" : "text-primary"}`}>{item.title}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${item.is_completed ? "text-expense/70" : "text-expense"}`}>{fmt(item.amount)}</span>
                    {!isReadOnly && <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-expense transition" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isAddModalOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-soft p-6 modal-animate">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">➕ Nuevo Ítem</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormType("income")} className={`flex-1 py-2.5 rounded-xl border transition-all ${formType === "income" ? "bg-income/10 border-income/40 text-income" : "border-border text-secondary hover:bg-surface-light"}`}>🟢 Ingreso</button>
                <button type="button" onClick={() => setFormType("expense")} className={`flex-1 py-2.5 rounded-xl border transition-all ${formType === "expense" ? "bg-expense/10 border-expense/40 text-expense" : "border-border text-secondary hover:bg-surface-light"}`}>🔴 Egreso</button>
              </div>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ej: Arriendo, Sueldo, Carne..." className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition" />
              <div className="flex items-center bg-surface-light border border-border rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
                <span className="text-primary font-semibold mr-1 select-none">$</span>
                <input type="text" inputMode="decimal" value={formAmount} onChange={e => setFormAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" className="w-full bg-transparent text-primary outline-none" />
              </div>
              {formError && <p className="text-expense text-xs text-center animate-pulse font-medium">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border text-secondary hover:bg-surface-light hover:text-primary transition">Cancelar</button>
                <button type="button" onClick={handleAddItem} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition disabled:opacity-50">{isSaving ? "Guardando..." : "Agregar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}