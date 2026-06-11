"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CheckItem {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  is_completed: boolean;
  due_date: string | null;
  category: string | null;
  week_number: number | null;
  paid_amount?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
}

interface Props {
  year: number;
  month: number;
  isReadOnly?: boolean;
}

export default function MonthlyChecklist({ year, month, isReadOnly = false }: Props) {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formCategory, setFormCategory] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const calculateWeekNumber = (dateString: string): number => {
    const date = new Date(dateString);
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  const getWeekDateRange = (weekNumber: number, year: number, month: number) => {
    const startDate = new Date(year, month - 1, (weekNumber - 1) * 7 + 1);
    const endDate = new Date(year, month - 1, weekNumber * 7);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    if (endDate.getDate() > lastDayOfMonth) {
      endDate.setDate(lastDayOfMonth);
    }
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("year", year)
      .eq("month", month);
    
    if (categoriesData) {
      setCategories(categoriesData as Category[]);
    }

    const { data: itemsData, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("year", year)
      .eq("month", month);

    if (error) {
      console.error("Error cargando checklist:", error);
    } else {
      const itemsWithProgress = await calculateProgress(itemsData || []);
      const sortedItems = sortItemsByPriority(itemsWithProgress);
      setItems(sortedItems);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!cancelled) await fetchData();
    };
    loadData();
    return () => { cancelled = true; };
  }, [year, month]);

    const calculateProgress = async (items: CheckItem[]): Promise<CheckItem[]> => {
    console.log("🚀 [SISTEMA ACTIVO] Aplicando Lógica Dual: Mensual para Ingresos, Semanal para Egresos...");
    
    const itemsWithProgress = await Promise.all(
      items.map(async (item) => {
        if (!item.category || !item.week_number || item.is_completed) {
          return { ...item, paid_amount: 0 };
        }

        // Limpiamos la categoría (quitamos emojis) para que la búsqueda sea flexible
        const cleanCategory = item.category
          .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
          .trim();

        let startDate: string;
        let endDate: string;

        // 1. PARA INGRESOS: Buscamos en TODO EL MES (fechas blindadas)
        if (item.type === "income") {
          const monthStr = month.toString().padStart(2, '0');
          // Fórmula infalible para obtener el último día del mes (28, 29, 30 o 31)
          const lastDay = new Date(year, month, 0).getDate();
          startDate = `${year}-${monthStr}-01`;
          endDate = `${year}-${monthStr}-${lastDay}`;
          console.log(`🔍 [INGRESO] Buscando "${item.title}" en TODO el mes: ${startDate} a ${endDate}`);
        } 
        // 2. PARA EGRESOS: Buscamos SOLO EN LA SEMANA ESPECÍFICA
        else {
          const weekStartDate = new Date(year, month - 1, (item.week_number - 1) * 7 + 1);
          const weekEndDate = new Date(year, month - 1, item.week_number * 7);
          const lastDayOfMonth = new Date(year, month, 0).getDate();
          if (weekEndDate.getDate() > lastDayOfMonth) {
            weekEndDate.setDate(lastDayOfMonth);
          }
          startDate = weekStartDate.toISOString().split('T')[0];
          endDate = weekEndDate.toISOString().split('T')[0];
          console.log(`🔍 [EGRESO] Buscando "${item.title}" en la semana: ${startDate} a ${endDate}`);
        }

        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("amount, date, category, type")
          .ilike("category", `%${cleanCategory}%`)
          .eq("type", item.type)
          .gte("date", startDate)
          .lte("date", endDate);

        if (error) {
          console.error(`❌ Error en consulta para "${item.title}":`, error);
          return { ...item, paid_amount: 0 };
        }

        const paidAmount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        console.log(`✅ "${item.title}": Encontradas ${transactions?.length || 0} transacciones. Acumulado: $${paidAmount}`);

        if (paidAmount >= item.amount && !item.is_completed) {
          await supabase.from("checklist_items").update({ is_completed: true }).eq("id", item.id);
          return { ...item, paid_amount: paidAmount, is_completed: true };
        }

        return { ...item, paid_amount: paidAmount };
      })
    );

    return itemsWithProgress;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const toggleItem = async (id: string, current: boolean) => {
    if (isReadOnly) return;
    const { error } = await supabase.from("checklist_items").update({ is_completed: !current }).eq("id", id);
    if (!error) {
      const updatedItems = items.map(i => i.id === id ? { ...i, is_completed: !current } : i);
      setItems(sortItemsByPriority(updatedItems));
    }
  };

  const deleteItem = async (id: string) => {
    if (isReadOnly || !window.confirm("¿Eliminar este ítem?")) return;
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (!error) {
      const updatedItems = items.filter(i => i.id !== id);
      setItems(sortItemsByPriority(updatedItems));
    }
  };

  const handleAddItem = async () => {
    if (isReadOnly || !formTitle.trim()) { 
      setFormError("Ingresa un título o concepto"); 
      return; 
    }
    
    const cleanAmount = formAmount.replace(/\./g, "").replace(",", ".");
    const amountNum = parseFloat(cleanAmount);
    if (isNaN(amountNum) || amountNum <= 0) { 
      setFormError("Ingresa un monto válido mayor a $0"); 
      return; 
    }

    if (!formDueDate) {
      setFormError(formType === "expense" ? "Selecciona una fecha de vencimiento" : "Selecciona una fecha de cobro");
      return;
    }

    setIsSaving(true); 
    setFormError("");
    
    const weekNumber = calculateWeekNumber(formDueDate);

    const { error } = await supabase.from("checklist_items").insert({ 
      year, 
      month, 
      title: formTitle.trim(), 
      amount: amountNum, 
      type: formType, 
      is_completed: false,
      due_date: formDueDate,
      category: formCategory || null,
      week_number: weekNumber
    });
    
    setIsSaving(false);
    
    if (error) { 
      setFormError("Error al guardar: " + error.message); 
    } else { 
      setFormTitle(""); 
      setFormAmount(""); 
      setFormType("expense");
      setFormCategory("");
      setFormDueDate("");
      setIsAddModalOpen(false); 
      await fetchData();
    }
  };

  const sortItemsByPriority = (itemsToSort: CheckItem[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    return [...itemsToSort].sort((a, b) => {
      if (a.is_completed && !b.is_completed) return 1;
      if (!a.is_completed && b.is_completed) return -1;

      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      const aOverdue = a.due_date < today;
      const bOverdue = b.due_date < today;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      return a.due_date.localeCompare(b.due_date);
    });
  };

  const incomes = sortItemsByPriority(items.filter(i => i.type === "income"));
  const expenses = sortItemsByPriority(items.filter(i => i.type === "expense"));
  
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, i) => sum + i.amount, 0);
  
  // CORREGIDO: El completado es la suma de los montos de los ítems totalmente completados
  const completedIncome = incomes.filter(i => i.is_completed).reduce((s, i) => s + i.amount, 0);
  const completedExp = expenses.filter(i => i.is_completed).reduce((s, i) => s + i.amount, 0);
  
  // CORREGIDO: El pendiente es la suma de lo que FALTA por pagar/cobrar de los ítems NO completados
  const pendingIncome = incomes.filter(i => !i.is_completed).reduce((s, i) => s + (i.amount - (i.paid_amount || 0)), 0);
  const pendingExp = expenses.filter(i => !i.is_completed).reduce((s, i) => s + (i.amount - (i.paid_amount || 0)), 0);

  const progress = totalExpense > 0 ? Math.round((completedExp / totalExpense) * 100) : 0;

  const filteredCategories = categories;

  const getDateLabel = (type: "income" | "expense") => type === "income" ? "Fecha de cobro" : "Fecha de vencimiento";
  const getPaidLabel = (type: "income" | "expense") => type === "income" ? "Cobrado" : "Pagado";
  const getMissingLabel = (type: "income" | "expense") => type === "income" ? "Falta por cobrar" : "Falta";
  const getDateIcon = (type: "income" | "expense", isOverdue: boolean) => {
    if (type === "income") return isOverdue ? "🔴 Vencido: " : "💰 ";
    return isOverdue ? "🔴 Vencido: " : "📅 ";
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" /><p className="text-secondary text-sm">Cargando checklist...</p></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">✅ Checklist {month.toString().padStart(2, "0")}/{year}</h2>
          <p className="text-secondary text-sm">Agrega tus ítems y márcalos al cumplirlos</p>
        </div>
        
        {!isReadOnly && (
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={isReadOnly || isRefreshing} 
              className="px-4 py-2 rounded-xl bg-surface border border-border text-secondary hover:text-primary hover:border-accent/40 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <span className={isRefreshing ? "animate-spin inline-block" : ""}>🔄</span>
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </button>

            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition flex items-center gap-2 shadow-glow">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Agregar Ítem
            </button>
          </div>
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
            <div className="flex justify-between text-sm"><span className="text-secondary">Progreso de pagos (egresos)</span><span className="font-medium text-primary">{progress}%</span></div>
            <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-income to-accent transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            {/* CORREGIDO: Ahora muestra el pendiente real (restando los abonos parciales) */}
            <div className="flex justify-between text-xs text-muted">
              <span>Pendiente: {fmt(pendingExp)}</span>
              <span>Completado: {fmt(completedExp)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-income flex items-center gap-2">💰 Entradas <span className="text-sm text-muted font-normal">({fmt(totalIncome)})</span></h3>
              {incomes.map(item => {
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = item.due_date && item.due_date < today && !item.is_completed;
                const progressPercent = item.amount > 0 ? Math.round(((item.paid_amount || 0) / item.amount) * 100) : 0;
                
                return (
                  <div key={item.id} className={`p-3 rounded-xl border transition-all ${
                    item.is_completed ? "bg-income/10 border-income/30 opacity-70" : 
                    isOverdue ? "bg-expense/5 border-expense/40" : 
                    "bg-surface border-border"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.is_completed} 
                          onChange={() => toggleItem(item.id, item.is_completed)} 
                          disabled={isReadOnly} 
                          className="w-5 h-5 rounded border-border text-income focus:ring-income/30 cursor-pointer disabled:opacity-50" 
                        />
                        <div className="flex-1">
                          <span className={`font-medium ${item.is_completed ? "text-income line-through opacity-80" : "text-primary"}`}>
                            {item.title}
                          </span>
                          {item.category ? (
                            <div className="text-xs text-muted mt-0.5">📁 {item.category}</div>
                          ) : (
                            <div className="text-xs text-expense mt-0.5">⚠️ Sin categoría (no se puede rastrear)</div>
                          )}
                          {item.due_date && (
                            <div className={`text-xs mt-0.5 ${isOverdue ? "text-expense font-medium" : "text-muted"}`}>
                              {getDateIcon(item.type, !!isOverdue)}
                              {new Date(item.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                              {item.week_number && ` (Sem ${item.week_number})`}
                            </div>
                          )}
                        </div>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${item.is_completed ? "text-income/70" : "text-income"}`}>{fmt(item.amount)}</div>
                          {item.paid_amount !== undefined && item.paid_amount > 0 && !item.is_completed && (
                            <div className="text-xs text-income/80">{getPaidLabel(item.type)}: {fmt(item.paid_amount)}</div>
                          )}
                        </div>
                        {!isReadOnly && (
                          <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-expense transition" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {item.paid_amount !== undefined && item.paid_amount > 0 && !item.is_completed && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted">
                          <span>Progreso</span><span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-income to-accent transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                        </div>
                        {progressPercent < 100 && (
                          <div className="text-xs text-muted text-right">{getMissingLabel(item.type)}: {fmt(item.amount - (item.paid_amount || 0))}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-expense flex items-center gap-2">📉 Salidas <span className="text-sm text-muted font-normal">({fmt(totalExpense)})</span></h3>
              {expenses.map(item => {
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = item.due_date && item.due_date < today && !item.is_completed;
                const progressPercent = item.amount > 0 ? Math.round(((item.paid_amount || 0) / item.amount) * 100) : 0;
                
                return (
                  <div key={item.id} className={`p-3 rounded-xl border transition-all ${
                    item.is_completed ? "bg-expense/10 border-expense/30 opacity-70" : 
                    isOverdue ? "bg-expense/5 border-expense/40" : 
                    "bg-surface border-border"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.is_completed} 
                          onChange={() => toggleItem(item.id, item.is_completed)} 
                          disabled={isReadOnly} 
                          className="w-5 h-5 rounded border-border text-expense focus:ring-expense/30 cursor-pointer disabled:opacity-50" 
                        />
                        <div className="flex-1">
                          <span className={`font-medium ${item.is_completed ? "text-expense line-through opacity-80" : "text-primary"}`}>
                            {item.title}
                          </span>
                          {item.category ? (
                            <div className="text-xs text-muted mt-0.5">📁 {item.category}</div>
                          ) : (
                            <div className="text-xs text-expense mt-0.5">⚠️ Sin categoría (no se puede rastrear)</div>
                          )}
                          {item.due_date && (
                            <div className={`text-xs mt-0.5 ${isOverdue ? "text-expense font-medium" : "text-muted"}`}>
                              {getDateIcon(item.type, !!isOverdue)}
                              {new Date(item.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                              {item.week_number && ` (Sem ${item.week_number})`}
                            </div>
                          )}
                        </div>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${item.is_completed ? "text-expense/70" : "text-expense"}`}>{fmt(item.amount)}</div>
                          {item.paid_amount !== undefined && item.paid_amount > 0 && !item.is_completed && (
                            <div className="text-xs text-expense/80">{getPaidLabel(item.type)}: {fmt(item.paid_amount)}</div>
                          )}
                        </div>
                        {!isReadOnly && (
                          <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-expense transition" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {item.paid_amount !== undefined && item.paid_amount > 0 && !item.is_completed && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted">
                          <span>Progreso</span><span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-surface-light h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-expense to-accent transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                        </div>
                        {progressPercent < 100 && (
                          <div className="text-xs text-muted text-right">{getMissingLabel(item.type)}: {fmt(item.amount - (item.paid_amount || 0))}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {isAddModalOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-soft p-6 modal-animate max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">➕ Nuevo Ítem</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => { setFormType("income"); setFormCategory(""); }} className={`flex-1 py-2.5 rounded-xl border transition-all ${formType === "income" ? "bg-income/10 border-income/40 text-income" : "border-border text-secondary hover:bg-surface-light"}`}>🟢 Ingreso</button>
                <button type="button" onClick={() => { setFormType("expense"); setFormCategory(""); }} className={`flex-1 py-2.5 rounded-xl border transition-all ${formType === "expense" ? "bg-expense/10 border-expense/40 text-expense" : "border-border text-secondary hover:bg-surface-light"}`}>🔴 Egreso</button>
              </div>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ej: Arriendo, Sueldo, Cuentas extras..." className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition" />
              <div className="flex items-center bg-surface-light border border-border rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
                <span className="text-primary font-semibold mr-1 select-none">$</span>
                <input type="text" inputMode="decimal" value={formAmount} onChange={e => setFormAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" className="w-full bg-transparent text-primary outline-none" />
              </div>
              
              <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition">
                <option value="">Sin categoría (opcional)</option>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))
                ) : (
                  <option disabled>No hay categorías creadas aún</option>
                )}
              </select>
              {formCategory === "" && (
                <p className="text-xs text-expense text-center animate-pulse font-medium">⚠️ Para que el acumulado funcione, DEBES seleccionar una categoría</p>
              )}

              <div>
                <label className="block text-sm text-secondary mb-1.5">
                  {getDateLabel(formType)}
                </label>
                <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} min={`${year}-${month.toString().padStart(2, '0')}-01`} max={`${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition" />
                {formDueDate && <p className="text-xs text-muted mt-1">📅 Semana {calculateWeekNumber(formDueDate)} del mes</p>}
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