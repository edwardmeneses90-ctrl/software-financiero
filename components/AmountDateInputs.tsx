"use client";
import { useState, useRef } from "react";

interface Props {
  amount: string;
  date: string;
  onAmountChange: (val: string) => void;
  onDateChange: (val: string) => void;
  disabled?: boolean; // ✅ Nueva prop
}

export default function AmountDateInputs({ amount, date, onAmountChange, onDateChange, disabled = false }: Props) {
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [amountError, setAmountError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const formatAmount = (val: string) => {
    let clean = val.replace(/[^\d.,]/g, "");
    clean = clean.replace(/\./g, "").replace(/,/g, ".");
    const parts = clean.split(".");
    const intPart = parts[0] || "";
    const decPart = parts.length > 1 ? parts[1].slice(0, 2) : undefined;
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    const rawBefore = input.value;
    const formatted = formatAmount(input.value);
    onAmountChange(formatted);
    setAmountError("");

    setTimeout(() => {
      if (inputRef.current) {
        let digitsBeforeCursor = 0;
        for (let i = 0; i < cursorPos && i < rawBefore.length; i++) {
          if (/\d/.test(rawBefore[i])) digitsBeforeCursor++;
        }
        let newCursor = 0;
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) count++;
          newCursor = i + 1;
          if (count === digitsBeforeCursor) break;
        }
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursor;
      }
    }, 0);
  };

  const handleAmountBlur = () => {
    if (disabled) return;
    const clean = amount.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    if (amount && (isNaN(num) || num <= 0)) {
      setAmountError("Ingresa un monto válido mayor a $0");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const dateValue = date || today;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* INPUT MONTO */}
      <div className="relative">
        <label className="text-sm text-secondary mb-1.5 block ml-1 font-medium">Monto</label>
        <div className={`
          flex items-center bg-surface border rounded-xl px-4 py-3 transition-all duration-200
          ${disabled ? "border-muted/20 bg-muted/5 cursor-not-allowed opacity-75" : isAmountFocused ? "border-accent shadow-glow" : "border-border hover:border-secondary/40"}
          ${amountError && !disabled ? "border-expense/60 bg-expense/5" : ""}
        `}>
          <span className="text-primary text-lg font-semibold mr-1 select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            onFocus={() => !disabled && setIsAmountFocused(true)}
            onBlur={() => { if (!disabled) { setIsAmountFocused(false); handleAmountBlur(); } }}
            placeholder="0"
            disabled={disabled}
            className={`w-full bg-transparent text-primary text-lg outline-none placeholder:text-muted/40 ${disabled ? "cursor-not-allowed" : ""}`}
          />
        </div>
        {amountError && !disabled && (
          <p className="text-expense text-xs mt-1.5 ml-1 animate-pulse font-medium">{amountError}</p>
        )}
      </div>

      {/* INPUT FECHA */}
      <div className="relative">
        <label className="text-sm text-secondary mb-1.5 block ml-1 font-medium">Fecha</label>
        <div className={`
          flex items-center bg-surface border rounded-xl px-4 py-3 transition-all duration-200
          ${disabled ? "border-muted/20 bg-muted/5 cursor-not-allowed opacity-75" : isDateFocused ? "border-accent shadow-glow" : "border-border hover:border-secondary/40"}
        `}>
          <span className="text-lg mr-2 select-none opacity-70">📅</span>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => !disabled && onDateChange(e.target.value)}
            onFocus={() => !disabled && setIsDateFocused(true)}
            onBlur={() => !disabled && setIsDateFocused(false)}
            disabled={disabled}
            suppressHydrationWarning
            className={`w-full bg-transparent text-primary outline-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          />
        </div>
      </div>
    </div>
  );
}