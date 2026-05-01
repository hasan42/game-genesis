import { useState, useRef } from 'react';

interface FABItem {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}

interface FloatingActionButtonProps {
  items: FABItem[];
}

export function FloatingActionButton({ items }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col-reverse items-center gap-2 sm:bottom-6 sm:right-6">
      {/* Expanded items */}
      {open && items.map((item, i) => (
        <div
          key={i}
          className="fab-item-enter flex items-center justify-end gap-2"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className="hidden sm:inline text-frost-300 text-sm bg-frost-900/90 px-2 py-1 rounded shadow-lg border border-frost-700/50">
            {item.label}
          </span>
          <button
            onClick={() => {
              item.onClick();
              setOpen(false);
            }}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg shadow-lg border transition-all duration-200 hover:scale-110 ${
              item.active
                ? 'bg-ice-800 border-ice-600 text-ice-100'
                : 'bg-frost-900/90 border-frost-700/50 text-frost-300 hover:bg-frost-800 hover:text-ice-300'
            }`}
            aria-label={item.label}
          >
            {item.icon}
            {item.badge != null && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ice-500 text-frost-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        </div>
      ))}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => {
          // Close after a short delay to allow item clicks
          timerRef.current = setTimeout(() => setOpen(false), 200);
        }}
        onFocus={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
        }}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl flex items-center justify-center text-xl transition-all duration-300 ${
          open
            ? 'bg-ice-700 rotate-45 border-ice-500'
            : 'bg-ice-800 border-ice-700 hover:bg-ice-700'
        } border`}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню действий'}
      >
        ✦
      </button>
    </div>
  );
}