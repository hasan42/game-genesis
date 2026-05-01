/**
 * StationMap — SVG-схема станции буровиков «Ледхом»
 * По описанию из книги: квадрат из 4 зданий + космопорт + малая шахта
 */

import { useState } from 'react';
import { useGameStore } from '../engine/store';

interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

const locations: MapLocation[] = [
  { id: 'residential', name: 'Жилой модуль', x: 120, y: 80, description: 'Основное здание станции: каюты, холл, медпункт, столовая' },
  { id: 'warehouse', name: 'Склад', x: 320, y: 80, description: 'Хранилище грузов и оборудования' },
  { id: 'command', name: 'Командный центр', x: 120, y: 220, description: 'Управление станцией, связь, исины' },
  { id: 'workshop', name: 'Мастерская', x: 320, y: 220, description: 'Ремонт и обслуживание техники' },
  { id: 'spaceport', name: 'Космопорт', x: 440, y: 150, description: 'Посадочная площадка, ангар для кораблей' },
  { id: 'mine', name: 'Малая шахта', x: 220, y: 320, description: 'Буровая вышка, добыча ресурсов' },
];

// Connections between locations
const connections = [
  ['residential', 'warehouse'],
  ['residential', 'command'],
  ['warehouse', 'workshop'],
  ['command', 'workshop'],
  ['warehouse', 'spaceport'],
  ['workshop', 'spaceport'],
  ['command', 'mine'],
  ['workshop', 'mine'],
];

function getLocationCenter(id: string): { x: number; y: number } {
  const loc = locations.find(l => l.id === id);
  return loc ? { x: loc.x, y: loc.y } : { x: 0, y: 0 };
}

export function StationMap({ onClose }: { onClose?: () => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const history = useGameStore(s => s.history);
  const currentParagraph = useGameStore(s => s.currentParagraph);

  // Map paragraphs to locations (rough mapping based on book content)
  const paragraphLocationMap: Record<string, number[]> = {
    residential: [1, 2, 3, 5, 7, 8, 9, 10, 14, 38, 39, 40, 42, 52, 56, 57, 58, 59, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 120, 121, 142, 159, 162, 175, 190, 191, 192, 194, 195, 196, 197, 198, 199, 200],
    warehouse: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 174],
    command: [4, 30, 31, 32, 33, 34, 35, 36, 37, 43, 44, 45, 46, 47, 48, 49, 50, 51, 119, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 160, 161, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189],
    workshop: [11, 12, 13, 53, 54, 55, 122, 123, 124, 125, 126, 127, 128, 129],
    spaceport: [95, 96, 97, 98, 193],
    mine: [6, 15, 27, 28, 29, 41],
  };

  // Determine visited locations
  const visitedParagraphs = new Set(history.map(h => h.paragraphId));
  const visitedLocations = new Set<string>();
  for (const [locId, paragraphs] of Object.entries(paragraphLocationMap)) {
    if (paragraphs.some(p => visitedParagraphs.has(p))) {
      visitedLocations.add(locId);
    }
  }

  // Determine current location
  const currentLocation = Object.entries(paragraphLocationMap).find(
    ([_, paragraphs]) => paragraphs.includes(currentParagraph)
  )?.[0] || null;

  const hoveredLocation = hoveredId ? locations.find(l => l.id === hoveredId) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-frost-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-frost-900 border border-frost-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-800">
          <h3 className="text-lg font-serif font-bold text-ice-200">🗺️ Карта станции</h3>
          <span className="text-frost-500 text-xs">Ледхом</span>
        </div>

        {/* Map SVG */}
        <div className="p-4 flex justify-center">
          <svg viewBox="0 0 520 380" className="w-full max-w-md" style={{ filter: 'drop-shadow(0 0 8px rgba(100,180,255,0.1))' }}>
            {/* Background */}
            <rect x="0" y="0" width="520" height="380" fill="#0a1628" rx="12" />

            {/* Grid */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a2a4a" strokeWidth="0.5" />
            </pattern>
            <rect x="0" y="0" width="520" height="380" fill="url(#grid)" rx="12" />

            {/* Connections */}
            {connections.map(([from, to], i) => {
              const a = getLocationCenter(from);
              const b = getLocationCenter(to);
              const visited = visitedLocations.has(from) && visitedLocations.has(to);
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={visited ? '#4a90d9' : '#1a2a4a'}
                  strokeWidth={visited ? 2 : 1}
                  strokeDasharray={visited ? 'none' : '4 4'}
                />
              );
            })}

            {/* Location nodes */}
            {locations.map(loc => {
              const isVisited = visitedLocations.has(loc.id);
              const isCurrent = currentLocation === loc.id;
              const isHovered = hoveredId === loc.id;

              let fillColor = '#1a2a4a';
              let strokeColor = '#2a3a5a';
              let textColor = '#4a6a9a';
              let radius = 28;

              if (isVisited) {
                fillColor = '#1a3a5a';
                strokeColor = '#4a90d9';
                textColor = '#8ab4f8';
              }
              if (isCurrent) {
                fillColor = '#2a4a7a';
                strokeColor = '#6ab0ff';
                textColor = '#c0d8ff';
                radius = 32;
              }
              if (isHovered) {
                strokeColor = '#8ab4f8';
                radius = 32;
              }

              return (
                <g
                  key={loc.id}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  {/* Glow effect for current */}
                  {isCurrent && (
                    <circle cx={loc.x} cy={loc.y} r={radius + 8} fill="none" stroke="#4a90d9" strokeWidth="1" opacity="0.3">
                      <animate attributeName="r" values={`${radius + 5};${radius + 12};${radius + 5}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={loc.x} cy={loc.y} r={radius} fill={fillColor} stroke={strokeColor} strokeWidth={isCurrent ? 2.5 : 1.5} />
                  <text x={loc.x} y={loc.y - 2} textAnchor="middle" dominantBaseline="middle" fill={textColor} fontSize="10" fontWeight="bold">
                    {loc.name.split(' ').map((word, i) => (
                      <tspan key={i} x={loc.x} dy={i === 0 ? '-0.3em' : '1.1em'}>{word}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {/* Snow/ice decoration */}
            <circle cx="40" cy="30" r="2" fill="#ffffff" opacity="0.2" />
            <circle cx="480" cy="50" r="1.5" fill="#ffffff" opacity="0.15" />
            <circle cx="50" cy="350" r="1" fill="#ffffff" opacity="0.1" />
            <circle cx="490" cy="340" r="2" fill="#ffffff" opacity="0.15" />
          </svg>
        </div>

        {/* Tooltip / Info */}
        <div className="px-5 py-3 border-t border-frost-800/50 min-h-[60px]">
          {hoveredLocation ? (
            <div>
              <div className="text-ice-200 font-serif text-sm font-bold mb-1">
                {hoveredLocation.name}
                {visitedLocations.has(hoveredLocation.id) && (
                  <span className="text-ice-500 text-xs ml-2">✓ посещено</span>
                )}
                {currentLocation === hoveredLocation.id && (
                  <span className="text-ice-400 text-xs ml-2">📍 вы здесь</span>
                )}
              </div>
              <div className="text-frost-400 text-xs">{hoveredLocation.description}</div>
            </div>
          ) : (
            <div className="text-frost-600 text-xs text-center">
              Наведите на локацию для подробностей
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
    >
      <span>🗺️</span>
      <span>Карта</span>
    </button>
  );
}