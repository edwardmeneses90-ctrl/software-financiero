"use client";

interface Props {
  currentView: string;
  onChangeView: (v: string) => void;
}

export default function MobileBottomNav({ currentView, onChangeView }: Props) {
  const items = [
    { id: "form", label: "Captura", icon: "📝" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "checklist", label: "Checklist", icon: "✅" },
    { id: "history", label: "Historial", icon: "📜" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-border h-16 flex items-center justify-around px-2 pb-safe shadow-soft">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChangeView(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentView === item.id ? "text-accent" : "text-muted hover:text-secondary"
          }`}
        >
          <span className="text-xl mb-0.5">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}