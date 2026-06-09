"use client";

interface Props {
  weeklyData: { target: number; actual: number }[];
  fmt: (n: number) => string;
}

export default function WeeklyChart({ weeklyData, fmt }: Props) {
  // Calcular escala máxima para ajustar barras proporcionalmente
  const maxVal = Math.max(...weeklyData.map(w => Math.max(w.actual, w.target)), 1);

  return (
    <div className="glass rounded-2xl p-5 shadow-soft">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">📊 Tendencia Semanal</h3>
      
      <div className="flex items-end justify-between gap-3 h-40 sm:h-48 px-2">
        {weeklyData.map((week, i) => {
          const actualHeight = Math.max((week.actual / maxVal) * 100, 4);
          const targetHeight = Math.max((week.target / maxVal) * 100, 4);
          const isOver = week.actual > week.target;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex justify-center items-end h-32 sm:h-40">
                {/* Línea de Meta */}
                <div
                  className="absolute w-1.5 bg-muted/30 rounded-full transition-all duration-500"
                  style={{ height: `${targetHeight}%` }}
                />
                {/* Barra de Gasto Real */}
                <div
                  className={`relative w-6 sm:w-8 rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-90 cursor-default ${
                    isOver ? "bg-expense/80" : "bg-gradient-to-t from-income/80 to-accent"
                  }`}
                  style={{ height: `${actualHeight}%` }}
                />
                {/* Tooltip al pasar el mouse */}
                <div className="absolute bottom-full mb-2 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-10">
                  <div className="font-medium">Real: {fmt(week.actual)}</div>
                  <div className="text-muted">Meta: {fmt(week.target)}</div>
                </div>
              </div>
              <span className="text-xs text-muted font-medium">S{i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-income to-accent inline-block"></span> Gasto real
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted/30 inline-block"></span> Meta semanal
        </span>
      </div>
    </div>
  );
}