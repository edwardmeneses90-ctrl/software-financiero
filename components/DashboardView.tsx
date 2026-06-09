"use client";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { PDFReport } from "./PDFReport";
import WeeklyChart from "./WeeklyChart";

interface DashboardProps {
  month: number;
  year: number;
  data: {
    income: number;
    expense: number;
    available: number;
    weekly: { target: number; actual: number }[];
    isLoading: boolean;
    transactions: { date: string; category: string; type: string; amount: number; icon: string }[];
  };
  targets: number[];
  onTargetChange: (weekIdx: number, newAmount: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  lastSynced: number | null;
  isReadOnly?: boolean;
}

export default function DashboardView({ month, year, data, targets, onTargetChange, onRefresh, lastSynced, isReadOnly = false }: DashboardProps) {
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [tempTarget, setTempTarget] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const months = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const startEdit = (idx: number) => {
    if (isReadOnly) return;
    setEditingWeek(idx);
    setTempTarget(targets[idx].toString().replace(/\./g, ""));
  };

  const saveTarget = () => {
    if (editingWeek === null || isReadOnly) return;
    const clean = tempTarget.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 0) onTargetChange(editingWeek, num);
    setEditingWeek(null);
  };

  const getSyncText = () => {
    if (!lastSynced) return "Sin sincronizar";
    const diff = Math.floor((Date.now() - lastSynced) / 1000);
    if (diff < 60) return "hace unos seg";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    return `hace ${Math.floor(diff / 3600)} h`;
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(
        <PDFReport title={`${months[month]} ${year}`} income={data.income} expense={data.expense} transactions={data.transactions} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Resumen_${months[month]}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (data.isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-secondary animate-pulse">Calculando resumen...</p>
      </div>
    );
  }

  const isEmpty = data.income === 0 && data.expense === 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
            📊 Control {month.toString().padStart(2, "0")}/{year}
          </h2>
          <p className="text-secondary text-sm sm:text-base">Tus metas semanales vs gasto real</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadPDF} disabled={isGeneratingPdf || isEmpty} className="p-2 rounded-xl bg-surface border border-border text-secondary hover:text-accent hover:border-accent/40 transition-all disabled:opacity-50" title="Descargar PDF">
            {isGeneratingPdf ? <span className="animate-spin text-lg">⌛</span> : "📄"}
          </button>
          <span className="hidden sm:inline text-xs text-muted/70 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-income/60 animate-pulse" />
            {getSyncText()}
          </span>
          <button onClick={onRefresh} disabled={isReadOnly} className="px-4 py-2 rounded-xl bg-surface border border-border text-secondary hover:text-primary hover:border-accent/40 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4 shadow-soft">
          <span className="text-5xl">📭</span>
          <p className="text-secondary text-lg">No hay movimientos registrados este mes</p>
          <p className="text-muted text-sm">Usa "📝 Captura" para agregar ingresos o gastos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Ingresos", value: data.income, colorClass: "text-income", icon: "📈" },
              { label: "Egresos", value: data.expense, colorClass: "text-expense", icon: "📉" },
              { label: "Disponible", value: data.available, colorClass: data.available >= 0 ? "text-accent" : "text-expense", icon: "💎" },
            ].map((card, i) => (
              <div key={i} className="glass rounded-2xl p-5 shadow-soft hover:-translate-y-1 transition-all duration-300 cursor-default group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
                  <span className="text-sm font-medium text-secondary uppercase tracking-wider">{card.label}</span>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${card.colorClass}`}>{fmt(card.value)}</p>
              </div>
            ))}
          </div>

          <WeeklyChart weeklyData={data.weekly} fmt={fmt} />

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary text-center flex items-center justify-center gap-2">📅 Metas Semanales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.weekly.map((week, i) => {
                const target = targets[i] || 0;
                const progress = target > 0 ? Math.min((week.actual / target) * 100, 100) : 0;
                const isOver = week.actual > target && target > 0;
                const statusColor = isOver ? "bg-expense/10 text-expense border-expense/20" : target > 0 ? "bg-income/10 text-income border-income/20" : "bg-muted/10 text-muted border-muted/20";
                const barColor = isOver ? "bg-expense" : "bg-gradient-to-r from-income to-accent";
                const isEditing = editingWeek === i && !isReadOnly;

                return (
                  <div key={i} className="glass rounded-2xl p-4 shadow-soft hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-secondary">Semana {i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                        {target === 0 ? "Sin meta" : isOver ? "⚠️ Excedido" : `${Math.round(progress)}%`}
                      </span>
                    </div>
                    
                    <div className="w-full bg-surface-light h-2.5 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Real: <span className="text-primary font-medium">{fmt(week.actual)}</span></span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted">Meta:</span>
                        {isEditing ? (
                          <input autoFocus type="text" inputMode="decimal" value={tempTarget} onChange={(e) => setTempTarget(e.target.value.replace(/[^\d.,]/g, ""))} onBlur={saveTarget} onKeyDown={(e) => e.key === "Enter" && saveTarget()} className="w-20 bg-surface-light border border-accent/30 rounded px-1.5 py-0.5 text-right text-primary outline-none" />
                        ) : (
                          <button onClick={() => startEdit(i)} disabled={isReadOnly} className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={isReadOnly ? "Solo lectura" : "Editar meta"}>
                            <span className="font-medium">{target > 0 ? fmt(target) : "$0"}</span>
                            {!isReadOnly && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}