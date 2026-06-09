    "use client";
import { useState, useEffect } from "react";

interface Props {
  onGoToCapture: () => void;
}

const LAST_TX_KEY = "finanzas_last_tx_date";
const REMINDER_KEY = "finanzas_reminder_last_shown";
const DAYS_THRESHOLD = 3;

export default function ActivityReminder({ onGoToCapture }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const lastTx = localStorage.getItem(LAST_TX_KEY);
    if (!lastTx) return;

    const lastDate = new Date(lastTx);
    const today = new Date();
    const diffDays = Math.floor(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= DAYS_THRESHOLD) {
      const lastShown = localStorage.getItem(REMINDER_KEY);
      if (!lastShown) {
        setIsVisible(true);
      } else {
        const daysSinceShown = Math.floor(Math.abs(today.getTime() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceShown >= 1) { // Muestra máximo 1 vez al día
          setIsVisible(true);
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(REMINDER_KEY, new Date().toISOString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      <div className="glass rounded-2xl p-4 shadow-soft border border-accent/20 bg-surface/95 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">⏳ ¿Todo en orden?</p>
          <p className="text-xs text-muted">Hace unos días que no registras movimientos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDismiss} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary hover:bg-surface-light transition">
            Ignorar
          </button>
          <button onClick={() => { handleDismiss(); onGoToCapture(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition">
            Ir a Captura
          </button>
        </div>
      </div>
    </div>
  );
}