import { useState } from 'react';
import { gameData } from '../engine/store';
import type { ReferenceSection } from '../engine/types';

export function ReferenceModal({ onClose }: { onClose: () => void }) {
  const sections: ReferenceSection[] = gameData.reference?.sections ?? [];
  const [activeSection, setActiveSection] = useState<string | null>(sections[0]?.id ?? null);

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-frost-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-frost-900 border border-frost-700 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-800 flex-shrink-0">
          <h3 className="text-lg font-serif font-bold text-ice-200">📖 Справочная информация</h3>
          <button
            onClick={onClose}
            className="text-frost-500 hover:text-frost-300 text-lg transition-colors"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-frost-800 overflow-x-auto flex-shrink-0">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-ice-800 text-ice-100'
                  : 'text-frost-400 hover:text-frost-200 hover:bg-frost-800'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {currentSection ? (
            <div>
              <h4 className="text-ice-300 font-display font-bold text-lg mb-3">{currentSection.title}</h4>
              <div className="space-y-3">
                {currentSection.text.map((line, i) => (
                  <p key={i} className="text-frost-300 leading-relaxed font-serif text-sm sm:text-base">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-frost-500 text-center">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}