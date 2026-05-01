import { useState, useRef, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) { // Only allow dragging down
      setDragY(delta);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-frost-950/60 backdrop-blur-sm transition-opacity" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-frost-900 border-t border-frost-700/50 rounded-t-2xl max-h-[60vh] overflow-y-auto transition-transform duration-300"
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-frost-600 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-2 text-frost-300 text-sm font-bold border-b border-frost-800/50">
            {title}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}