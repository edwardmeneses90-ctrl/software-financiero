"use client";

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthYearSelector({ year, month, onChange }: Props) {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(year, parseInt(e.target.value));
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(parseInt(e.target.value), month);

  return (
    <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 shadow-soft">
      <select 
        value={month} 
        onChange={handleMonthChange} 
        className="bg-transparent text-primary text-sm font-medium outline-none cursor-pointer hover:text-accent transition-colors"
      >
        {months.map((m, i) => (
          <option key={i + 1} value={i + 1} className="bg-surface text-primary">{m}</option>
        ))}
      </select>
      <span className="text-muted text-sm">/</span>
      <select 
        value={year} 
        onChange={handleYearChange} 
        className="bg-transparent text-primary text-sm font-medium outline-none cursor-pointer hover:text-accent transition-colors"
      >
        {years.map(y => (
          <option key={y} value={y} className="bg-surface text-primary">{y}</option>
        ))}
      </select>
    </div>
  );
}