"use client";

interface Props {
  value: "income" | "expense" | null;
  onChange: (val: "income" | "expense") => void;
  disabled?: boolean;
}

export default function TransactionTypeSelector({ value, onChange, disabled = false }: Props) {
  return (
    <div className="w-full max-w-md mx-auto flex gap-3">
      <button
        onClick={() => !disabled && onChange("income")}
        disabled={disabled}
        className={`flex-1 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-base flex items-center justify-center gap-2 ${
          value === "income"
            ? "border-income/50 bg-income/10 text-income shadow-glow-income"
            : "border-border text-secondary hover:border-income/30 hover:bg-income/5"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        🟢 Ingreso / Caja
      </button>
      <button
        onClick={() => !disabled && onChange("expense")}
        disabled={disabled}
        className={`flex-1 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-base flex items-center justify-center gap-2 ${
          value === "expense"
            ? "border-expense/50 bg-expense/10 text-expense shadow-glow-expense"
            : "border-border text-secondary hover:border-expense/30 hover:bg-expense/5"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        🔴 Egreso / Pago
      </button>
    </div>
  );
}