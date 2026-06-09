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
}

interface Props {
  year: number;
  month: number;
}

export default function SmartAlerts({ year, month }: Props) {
  const [alerts, setAlerts] = useState<{ type: "overdue" | "upcoming" | "partial"; message: string; icon: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    let cancelled = false;
    const loadAlerts = async () => {
      setIsLoading(true);
      
      const { data: items } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("year", year)
        .eq("month", month);

      if (cancelled || !items) { setIsLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];
      const newAlerts: typeof alerts = [];

      for (const item of items) {
        if (item.is_completed) continue;

        // NUEVO: Textos dinámicos según tipo
        const isIncome = item.type === "income";
        const actionVerb = isIncome ? "cobrar" : "pagar"; // "por cobrar" o "por pagar"
        const pastVerb = isIncome ? "cobrado" : "pagado";

        // 1. Verificar si está vencido
        if (item.due_date && item.due_date < today) {
          newAlerts.push({
            type: "overdue",
            icon: "🔴",
            message: `"${item.title}" está vencido desde el ${new Date(item.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
          });
          continue;
        }

        // 2. Verificar si vence/cobra en los próximos 3 días
        if (item.due_date) {
          const dueDate = new Date(item.due_date + 'T12:00:00');
          const todayDate = new Date(today + 'T12:00:00');
          const daysDiff = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 0 && daysDiff <= 3) {
            const actionText = isIncome ? "cobras" : "vence";
            newAlerts.push({
              type: "upcoming",
              icon: "🟡",
              message: daysDiff === 0 
                ? `"${item.title}" ${isIncome ? "se cobra" : "vence"} HOY (${fmt(item.amount)})`
                : daysDiff === 1 
                ? `"${item.title}" ${isIncome ? "se cobra" : "vence"} mañana (${fmt(item.amount)})`
                : `"${item.title}" ${isIncome ? "se cobra" : "vence"} en ${daysDiff} días (${fmt(item.amount)})`
            });
            continue;
          }
        }

        // 3. Verificar pagos/cobros parciales
        if (item.category && item.week_number) {
          const startDate = new Date(year, month - 1, (item.week_number - 1) * 7 + 1);
          const endDate = new Date(year, month - 1, item.week_number * 7);
          const lastDayOfMonth = new Date(year, month, 0).getDate();
          if (endDate.getDate() > lastDayOfMonth) endDate.setDate(lastDayOfMonth);

          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("category", item.category)
            .eq("type", item.type)
            .gte("date", startDate.toISOString().split('T')[0])
            .lte("date", endDate.toISOString().split('T')[0]);

          const paidAmount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const remaining = item.amount - paidAmount;
          const progressPercent = item.amount > 0 ? (paidAmount / item.amount) * 100 : 0;

          if (paidAmount > 0 && progressPercent < 100 && progressPercent >= 50) {
            newAlerts.push({
              type: "partial",
              icon: "💡",
              message: `Te faltan ${fmt(remaining)} por ${actionVerb} de "${item.title}" (${Math.round(progressPercent)}% ${pastVerb})`
            });
          }
        }
      }

      setAlerts(newAlerts);
      setIsLoading(false);
    };

    loadAlerts();
    return () => { cancelled = true; };
  }, [year, month]);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-sm">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="glass rounded-2xl p-5 shadow-soft border-l-4 border-income/50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <div>
            <h4 className="font-semibold text-income">¡Todo al día!</h4>
            <p className="text-sm text-secondary">No tienes pagos pendientes ni cobros por realizar.</p>
          </div>
        </div>
      </div>
    );
  }

  const priorityOrder = { overdue: 1, upcoming: 2, partial: 3 };
  const sortedAlerts = [...alerts].sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]).slice(0, 3);

  const hasCritical = sortedAlerts.some(a => a.type === "overdue" || a.type === "upcoming");
  const borderColor = hasCritical ? "border-expense/50" : "border-accent/50";

  return (
    <div className={`glass rounded-2xl p-5 shadow-soft border-l-4 ${borderColor} space-y-3`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-primary flex items-center gap-2">
          🔔 Alertas Inteligentes
          <span className="text-xs bg-expense/10 text-expense px-2 py-0.5 rounded-full font-medium">
            {alerts.length}
          </span>
        </h4>
      </div>
      
      <div className="space-y-2">
        {sortedAlerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-light/50 hover:bg-surface-light transition-colors">
            <span className="text-lg flex-shrink-0">{alert.icon}</span>
            <p className="text-sm text-primary leading-snug">{alert.message}</p>
          </div>
        ))}
        {alerts.length > 3 && (
          <p className="text-xs text-muted text-center pt-1">
            Y {alerts.length - 3} alerta(s) más...
          </p>
        )}
      </div>
    </div>
  );
}