"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import EditTransactionModal from "./EditTransactionModal";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
}

interface Props {
  year: number;
  month: number;
  categories: string[];
  isReadOnly?: boolean;
}

export default function TransactionHistory({ year, month, categories, isReadOnly = false }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const getSyncText = () => {
    if (!lastSynced) return "";
    const diff = Math.floor((Date.now() - lastSynced) / 1000);
    if (diff < 60) return "hace unos seg";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    return `hace ${Math.floor(diff / 3600)} h`;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchTx = async () => {
      setIsLoading(true); setError(null);
      try {
        const start = `${year}-${month.toString().padStart(2, "0")}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const end = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`;
        const { data, error } = await supabase.from("transactions").select("*").gte("date", start).lt("date", end).order("date", { ascending: false });
        if (error) throw new Error(error.message || "Error desconocido");
        if (!cancelled) setTransactions(data as Transaction[] || []);
        setLastSynced(Date.now());
      } catch (err: any) { if (!cancelled) setError(err.message || "No se pudieron cargar los registros."); }
      finally { if (!cancelled) setIsLoading(false); }
    };
    fetchTx();
    return () => { cancelled = true; };
  }, [year, month]);

  const handleDelete = async (id: string) => {
    if (isReadOnly || !window.confirm("¿Eliminar este registro permanentemente?")) return;
    setActionId(id);
    try { const { error } = await supabase.from("transactions").delete().eq("id", id); if (error) throw new Error(error.message); setTransactions(prev => prev.filter(tx => tx.id !== id)); }
    catch (err: any) { alert("Error al eliminar: " + (err.message || "Inténtalo de nuevo.")); }
    finally { setActionId(null); }
  };

  const openEdit = (tx: Transaction) => { if (!isReadOnly) { setEditingTx(tx); setIsEditModalOpen(true); } };

  const handleSaveEdit = async (id: string, data: { type: string; category: string; amount: number; date: string }) => {
    if (isReadOnly) return;
    const { error } = await supabase.from("transactions").update({ type: data.type, category: data.category, amount: data.amount, date: data.date }).eq("id", id);
    if (error) throw new Error(error.message);
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, type: data.type as any, category: data.category, amount: data.amount, date: data.date } : tx));
    setLastSynced(Date.now());
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Fecha", "Tipo", "Categoría", "Monto"];
    const rows = filtered.map(tx => [tx.date, tx.type === "income" ? "Ingreso" : "Egreso", tx.category, tx.amount.toFixed(2).replace(".", ",")]);
    const csvContent = [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transacciones_${year}_${month.toString().padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = transactions.filter(tx => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCat !== "all" && tx.category !== filterCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return tx.category.toLowerCase().includes(q) || tx.amount.toString().includes(q) || fmt(tx.amount).toLowerCase().includes(q) || tx.date.includes(q);
    }
    return true;
  });

  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">📜 Historial del Mes</h2>
          <span className="hidden sm:inline-flex text-xs text-muted/70 items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-income/60 animate-pulse" />
            {getSyncText()}
          </span>
          <button onClick={handleExportCSV} disabled={filtered.length === 0} className="hidden sm:flex px-3 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2">
            📤 Exportar CSV
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoría, monto o fecha..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-primary placeholder:text-muted/60 outline-none focus:border-accent transition" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>}
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 min-w-[140px] bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-accent">
            <option value="all">Todos los tipos</option>
            <option value="income">🟢 Ingresos</option>
            <option value="expense">🔴 Egresos</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="flex-1 min-w-[140px] bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-accent">
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleExportCSV} disabled={filtered.length === 0} className="sm:hidden flex-1 px-3 py-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            📤 Exportar
          </button>
        </div>
      </div>

      {error ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3 border border-expense/20 bg-expense/5">
          <span className="text-3xl">⚠️</span>
          <p className="text-expense font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary underline hover:text-accent">Reintentar</button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-secondary text-sm">Cargando registros...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center space-y-3">
          <span className="text-4xl">🔍</span>
          <p className="text-secondary">Sin movimientos que coincidan con tu búsqueda o filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => (
            <div key={tx.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                  {tx.type === 'income' ? '📈' : '📉'}
                </span>
                <div>
                  <p className="font-medium text-primary">{tx.category}</p>
                  <p className="text-xs text-muted">{formatDate(tx.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`text-lg font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {tx.type === 'income' ? '+' : '-'} {fmt(tx.amount)}
                </span>
                {!isReadOnly && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(tx)} className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(tx.id)} disabled={actionId === tx.id} className="p-2 rounded-lg text-muted hover:text-expense hover:bg-expense/10 transition-colors disabled:opacity-50" title="Eliminar">
                      {actionId === tx.id ? <span className="animate-spin inline-block">⌛</span> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEdit} initialData={editingTx} categories={categories} />}
    </div>
  );
}