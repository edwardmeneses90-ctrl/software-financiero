"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import TransactionTypeSelector from "@/components/TransactionTypeSelector";
import AmountDateInputs from "@/components/AmountDateInputs";
import CategorySelector from "@/components/CategorySelector";
import CategoryModal from "@/components/CategoryModal";
import SaveTransactionButton from "@/components/SaveTransactionButton";
import DashboardView from "@/components/DashboardView";
import TransactionHistory from "@/components/TransactionHistory";
import MonthlyChecklist from "@/components/MonthlyChecklist";
import MonthYearSelector from "@/components/MonthYearSelector";
import ActivityReminder from "@/components/ActivityReminder";
import AuthHeader from "@/components/AuthHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

interface CategoryItem { name: string; icon?: string; }

export default function Home() {
  const [view, setView] = useState<"form" | "dashboard" | "checklist" | "history">("form");
  
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isReadOnly = activeYear < currentYear || (activeYear === currentYear && activeMonth < currentMonth);

  const [selectedType, setSelectedType] = useState<"income" | "expense" | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null, msg: string }>({ type: null, msg: "" });

  const [dashboardData, setDashboardData] = useState({
    income: 0, expense: 0, available: 0, weekly: [] as { target: number; actual: number }[], isLoading: false, transactions: [] as any[]
  });
  const [weeklyTargets, setWeeklyTargets] = useState<number[]>([0, 0, 0, 0]);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true }));
    const { data: txData, error: txError } = await supabase.from("transactions").select("type, amount, date, category").order("date", { ascending: true });
    if (txError) { console.error("Error cargando transacciones:", txError); setDashboardData(prev => ({ ...prev, isLoading: false })); return; }

    let income = 0, expense = 0;
    const weeklyActuals = [0, 0, 0, 0];
    const monthlyTx = (txData || []).filter(tx => {
      const txDate = new Date(tx.date + "T00:00:00");
      return txDate.getFullYear() === activeYear && txDate.getMonth() + 1 === activeMonth;
    }).map(tx => ({
      ...tx,
      icon: categories.find(c => c.name === tx.category)?.icon || "📦"
    }));

    monthlyTx.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "income") income += amt; else expense += amt;
      const day = new Date(tx.date + "T00:00:00").getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
      if (tx.type === "expense") weeklyActuals[weekIdx] += amt;
    });

    const { data: targetData } = await supabase.from("weekly_targets").select("week, amount").eq("year", activeYear).eq("month", activeMonth);
    const targets = [0, 0, 0, 0];
    targetData?.forEach(t => { targets[t.week - 1] = Number(t.amount); });
    setWeeklyTargets(targets);

    setDashboardData({ income, expense, available: income - expense, weekly: weeklyActuals.map((actual, i) => ({ target: targets[i], actual })), isLoading: false, transactions: monthlyTx });
    setLastSynced(Date.now());
  }, [activeYear, activeMonth, categories]);

  useEffect(() => { if (view === "dashboard") fetchDashboardData(); }, [view, activeYear, activeMonth, fetchDashboardData]);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      const { data, error } = await supabase.from("categories").select("name, icon").eq("year", activeYear).eq("month", activeMonth).order("created_at", { ascending: true });
      if (!cancelled) { if (error) console.error("Error cargando categorías:", error); else setCategories(data?.map((c) => ({ name: c.name, icon: c.icon || "📦" })) || []); setIsLoadingCategories(false); }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, [activeYear, activeMonth]);

  const handleAddCategory = async (name: string, icon: string) => {
    if (isReadOnly || categories.some(c => c.name === name)) return;
    const { error } = await supabase.from("categories").insert({ name, icon, type: selectedType || "expense", year: activeYear, month: activeMonth });
    if (!error) { setCategories(prev => [...prev, { name, icon }]); setSelectedCategory(name); }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (isReadOnly || selectedCategory === catToDelete) setSelectedCategory("");
    const { error } = await supabase.from("categories").delete().eq("name", catToDelete).eq("year", activeYear).eq("month", activeMonth);
    if (!error) setCategories(prev => prev.filter(c => c.name !== catToDelete));
  };

  const handleSaveTransaction = async () => {
    if (isReadOnly) return;
    const cleanAmountStr = amount.replace(/\./g, "").replace(",", ".");
    const numericAmount = parseFloat(cleanAmountStr);
    if (!selectedType) { setFeedback({ type: "error", msg: "Selecciona un tipo" }); return; }
    if (!selectedCategory) { setFeedback({ type: "error", msg: "Selecciona categoría" }); return; }
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) { setFeedback({ type: "error", msg: "Monto inválido" }); return; }
    if (!date) { setFeedback({ type: "error", msg: "Selecciona fecha" }); return; }

    setIsSaving(true); setFeedback({ type: null, msg: "" });
    const { error } = await supabase.from("transactions").insert({ type: selectedType, category: selectedCategory, amount: numericAmount, date });
    setIsSaving(false);
    if (error) { setFeedback({ type: "error", msg: "Error: " + error.message }); }
    else {
      setFeedback({ type: "success", msg: "✅ Guardado" });
      setAmount("");
      setSelectedCategory("");
      localStorage.setItem("finanzas_last_tx_date", new Date().toISOString());
      localStorage.removeItem("finanzas_reminder_last_shown");
      fetchDashboardData();
      setTimeout(() => setFeedback({ type: null, msg: "" }), 3000);
    }
  };

  const handleTargetChange = async (weekIdx: number, newAmount: number) => {
    if (isReadOnly) return;
    const newTargets = [...weeklyTargets];
    newTargets[weekIdx] = newAmount;
    setWeeklyTargets(newTargets);
    await supabase.from("weekly_targets").upsert({ year: activeYear, month: activeMonth, week: weekIdx + 1, amount: newAmount }, { onConflict: "year,month,week" });
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 pb-24 sm:pb-10 transition-all duration-300 flex flex-col items-center">
      <AuthHeader />
      
      <div className="w-full max-w-xl flex justify-center mb-4 sm:mb-6 mt-10 sm:mt-0">
        <MonthYearSelector year={activeYear} month={activeMonth} onChange={(y, m) => { setActiveYear(y); setActiveMonth(m); }} />
      </div>

      <div className="hidden sm:flex w-full max-w-xl justify-center mb-6">
        <div className="inline-flex bg-surface/90 backdrop-blur-md border border-border rounded-full p-1 shadow-soft overflow-x-auto max-w-full">
          {[
            { id: "form", label: "📝 Captura" },
            { id: "dashboard", label: "📊 Dashboard" },
            { id: "checklist", label: "✅ Checklist" },
            { id: "history", label: "📜 Historial" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as any)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${view === tab.id ? "bg-surface text-primary shadow-sm" : "text-secondary hover:text-primary"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isReadOnly && (
        <div className="w-full max-w-5xl mx-auto mb-4 px-4 py-2 rounded-xl bg-muted/10 border border-muted/20 flex items-center justify-center gap-2 text-sm text-muted">
          🔒 Estás viendo un mes pasado. Los datos están en modo solo lectura.
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
        {view === "form" && (
          <div className="flex flex-col items-center gap-6 w-full">
            <TransactionTypeSelector value={selectedType} onChange={setSelectedType} disabled={isReadOnly} />
            <AmountDateInputs amount={amount} date={date} onAmountChange={setAmount} onDateChange={setDate} disabled={isReadOnly} />
            <div className="w-full max-w-md mx-auto">
              <CategorySelector value={selectedCategory} categories={categories} onChange={setSelectedCategory} onAddNew={() => setIsCategoryModalOpen(true)} onDelete={handleDeleteCategory} isReadOnly={isReadOnly} />
              {isLoadingCategories && <p className="text-xs text-muted mt-1.5 text-center animate-pulse">Sincronizando...</p>}
            </div>
            {feedback.msg && <div className={`px-4 py-3 rounded-xl text-sm font-medium text-center w-full max-w-md transition-all ${feedback.type === "success" ? "bg-income/10 text-income border border-income/20" : "bg-expense/10 text-expense border border-expense/20"}`}>{feedback.msg}</div>}
            <SaveTransactionButton isLoading={isSaving} onClick={handleSaveTransaction} disabled={isSaving || isReadOnly} />
            <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSave={handleAddCategory} />
          </div>
        )}

        {view === "dashboard" && (
          <DashboardView month={activeMonth} year={activeYear} data={dashboardData} targets={weeklyTargets} onTargetChange={handleTargetChange} onRefresh={fetchDashboardData} lastSynced={lastSynced} isReadOnly={isReadOnly} />
        )}

        {view === "checklist" && (
          <MonthlyChecklist year={activeYear} month={activeMonth} isReadOnly={isReadOnly} />
        )}

        {view === "history" && (
          <TransactionHistory year={activeYear} month={activeMonth} categories={categories.map(c => c.name)} isReadOnly={isReadOnly} />
        )}
      </div>

      <ActivityReminder onGoToCapture={() => setView("form")} />
      <MobileBottomNav currentView={view} onChangeView={(v) => setView(v as any)} />
    </main>
  );
}