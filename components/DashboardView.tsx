"use client";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { PDFReport } from "./PDFReport";
import WeeklyChart from "./WeeklyChart";
import SmartAlerts from "./SmartAlerts";

interface DashboardProps {
  month: number;
  year: number;
  data: {
    income: number;
    expense: number;
    available: number;
    weekly: { income: number; expense: number; previousBalance: number; balance: number }[];
    isLoading: boolean;
    transactions: { date: string; category: string; type: string; amount: number; icon: string }[];
  };
  onRefresh: () => Promise<void>;
  lastSynced: number | null;
  isReadOnly?: boolean;
}

export default function DashboardView({ month, year, data, onRefresh, lastSynced, isReadOnly = false }: DashboardProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const months = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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

  const getCriticalWeek = () => {
    if (data.weekly.length === 0) return -1;
    const weekWithActivity = data.weekly.map((w, i) => ({ ...w, idx: i })).filter(w => w.income > 0 || w.expense > 0 || w.previousBalance !== 0);
    if (weekWithActivity.length === 0) return -1;

    const lowestBalance = Math.min(...weekWithActivity.map(w => w.balance));
    const criticalByBalance = weekWithActivity.filter(w => w.balance === lowestBalance);
    if (lowestBalance < 0 || criticalByBalance.length > 0) {
      return criticalByBalance[0].idx;
    }

    const highestExpense = Math.max(...weekWithActivity.map(w => w.expense));
    const criticalByExpense = weekWithActivity.filter(w => w.expense === highestExpense);
    return criticalByExpense[0].idx;
  };

  const criticalWeekIdx = getCriticalWeek();

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
          <p className="text-secondary text-sm sm:text-base">Análisis automático de tus finanzas</p>
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
          <SmartAlerts year={year} month={month} />

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

          <WeeklyChart weeklyData={data.weekly.map(w => ({ target: 0, actual: w.expense }))} fmt={fmt} />

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary text-center flex items-center justify-center gap-2">
              📅 Análisis Semanal Acumulativo
              {criticalWeekIdx >= 0 && (
                <span className="text-xs bg-expense/10 text-expense px-2 py-1 rounded-full font-medium">
                  ⚠️ Semana {criticalWeekIdx + 1} es la más crítica
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.weekly.map((week, i) => {
                const isCritical = i === criticalWeekIdx;
                const hasActivity = week.income > 0 || week.expense > 0 || week.previousBalance !== 0;
                const isDeficit = week.balance < 0;
                
                return (
                  <div 
                    key={i} 
                    className={`glass rounded-2xl p-4 shadow-soft transition-all duration-300 ${
                      isCritical ? "ring-2 ring-expense/50 scale-[1.02] bg-expense/5" : "hover:scale-[1.02]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-primary">Semana {i + 1}</span>
                      {isCritical && <span className="text-xs font-medium text-expense">⚠️ Crítica</span>}
                      {!isCritical && !hasActivity && <span className="text-xs text-muted">Sin actividad</span>}
                      {!isCritical && hasActivity && !isDeficit && week.balance > 0 && (
                        <span className="text-xs bg-income/10 text-income px-2 py-0.5 rounded-full font-medium">✓ Superávit</span>
                      )}
                      {!isCritical && hasActivity && isDeficit && (
                        <span className="text-xs bg-expense/10 text-expense px-2 py-0.5 rounded-full font-medium">Déficit</span>
                      )}
                    </div>

                    {hasActivity && (
                      <div className="space-y-2 mb-3 text-xs">
                        {/* NUEVO: Mostrar arrastre si existe */}
                        {week.previousBalance !== 0 && (
                          <div className="flex justify-between text-muted/80 border-b border-border/30 pb-1 mb-1">
                            <span>Arrastre (Disponible):</span>
                            <span className="font-medium text-primary">{fmt(week.previousBalance)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-muted">Ingresos:</span>
                          <span className="text-income font-medium">{fmt(week.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Egresos:</span>
                          <span className="text-expense font-medium">-{fmt(week.expense)}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Balance Final:</span>
                        <span className={`text-lg font-bold ${
                          !hasActivity ? "text-muted" :
                          week.balance > 0 ? "text-income" :
                          week.balance < 0 ? "text-expense" :
                          "text-secondary"
                        }`}>
                          {hasActivity ? fmt(week.balance) : "—"}
                        </span>
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