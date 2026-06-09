"use client";

interface Props {
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
}

export default function SaveTransactionButton({ isLoading, onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        w-full max-w-md mx-auto py-4 rounded-2xl font-semibold text-lg tracking-wide
        transition-all duration-300 ease-out flex items-center justify-center gap-2
        ${disabled 
          ? "bg-surface-light text-muted cursor-not-allowed opacity-60" 
          : "bg-gradient-to-r from-accent via-accent/90 to-accent/80 text-white shadow-glow hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        }
      `}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Guardando...</span>
        </>
      ) : (
        <span>💾 Guardar Movimiento</span>
      )}
    </button>
  );
}