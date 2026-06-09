"use client";
import { useState, useRef, useEffect } from "react";

interface Category {
  name: string;
  icon?: string;
}

interface Props {
  value: string;
  categories: Category[];
  onChange: (val: string) => void;
  onAddNew: () => void;
  onDelete?: (cat: string) => void;
  isReadOnly?: boolean;
}

export default function CategorySelector({ value, categories, onChange, onAddNew, onDelete, isReadOnly = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cat: string) => { onChange(cat); setIsOpen(false); };
  const handleDelete = (e: React.MouseEvent, cat: string) => { e.stopPropagation(); if (onDelete && !isReadOnly) onDelete(cat); };

  const getCategoryIcon = (name: string) => {
    const cat = categories.find(c => c.name === name);
    return cat?.icon || "📦";
  };

  return (
    <div className="w-full max-w-md mx-auto relative" ref={containerRef}>
      <label className="text-sm text-secondary mb-1.5 block ml-1 font-medium">Categoría</label>
      
      <button type="button" onClick={() => !isReadOnly && setIsOpen(!isOpen)} disabled={isReadOnly}
        className={`w-full flex items-center justify-between bg-surface border rounded-xl px-4 py-3 text-left transition-all ${isReadOnly ? "border-muted/20 bg-muted/5 cursor-not-allowed opacity-75" : "border-border hover:border-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/20"}`}>
        <span className={`flex items-center gap-2 ${value ? "text-primary" : "text-muted/60"}`}>
          {value && <span className="text-lg">{getCategoryIcon(value)}</span>}
          {value || "Selecciona o crea una categoría"}
        </span>
        {!isReadOnly && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>}
      </button>

      {isOpen && !isReadOnly && (
        <div className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-soft overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="px-4 py-4 text-center text-muted text-sm">No hay categorías aún</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.name} onClick={() => handleSelect(cat.name)} className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${value === cat.name ? "bg-accent/10 text-accent" : "text-primary hover:bg-surface-light"}`}>
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{cat.icon || "📦"}</span>
                    {cat.name}
                  </span>
                  {onDelete && (
                    <button onClick={(e) => handleDelete(e, cat.name)} className="ml-3 p-1 rounded-full text-expense hover:bg-expense/10 transition-colors opacity-70 hover:opacity-100" title={`Eliminar "${cat.name}"`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <button onClick={() => { onAddNew(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-accent border-t border-border hover:bg-surface-light transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Añadir nueva categoría
          </button>
        </div>
      )}
    </div>
  );
}