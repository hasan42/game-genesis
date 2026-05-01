/**
 * CharacterPortrait — стилизованные SVG-силуэты персонажей
 * Показываются в параграфах где персонаж говорит (определяется по имени в кавычках)
 * Размер: 48x48px, fade-in анимация
 */

import { useMemo, useState, useEffect } from 'react';

export interface CharacterDef {
  name: string;
  color: string;        // Tailwind color class
  colorHex: string;     // Hex color for SVG
  silhouette: 'angular' | 'round' | 'tall' | 'broad' | 'slim' | 'standard';
}

export const CHARACTERS: CharacterDef[] = [
  { name: 'Синти',  color: 'text-ice-400',    colorHex: '#38bdf8', silhouette: 'angular' },
  { name: 'Сайпл',  color: 'text-amber-400',   colorHex: '#fbbf24', silhouette: 'slim' },
  { name: 'Плантуш', color: 'text-red-400',    colorHex: '#f87171', silhouette: 'broad' },
  { name: 'Грог',    color: 'text-green-400',  colorHex: '#4ade80', silhouette: 'tall' },
  { name: 'Тапер',   color: 'text-purple-400', colorHex: '#c084fc', silhouette: 'round' },
  { name: 'Нодрик',  color: 'text-blue-400',   colorHex: '#60a5fa', silhouette: 'standard' },
];

function findCharacterInText(textLines: string[]): CharacterDef | null {
  // Look for character name in quotes: «Синти», «Плантуш» etc.
  for (const line of textLines) {
    for (const char of CHARACTERS) {
      // Check various patterns: «Имя», "Имя", — Имя, Имя:
      if (
        line.includes(`«${char.name}`) ||
        line.includes(`"${char.name}`) ||
        line.includes(`— ${char.name}`) ||
        line.includes(`${char.name}:`) ||
        line.includes(`${char.name} сказал`) ||
        line.includes(`${char.name} говорит`) ||
        line.includes(`${char.name} ответил`) ||
        line.includes(`${char.name} спросил`)
      ) {
        return char;
      }
    }
  }
  return null;
}

// SVG silhouette paths for different character shapes
function CharacterSVG({ character }: { character: CharacterDef }) {
  const { silhouette, colorHex } = character;

  // Each silhouette is a minimal head + shoulders profile
  switch (silhouette) {
    case 'angular':
      // Синти — sharp, angular features
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — slightly angular */}
          <path
            d="M24 6 C28 6, 32 10, 32 16 C32 20, 30 23, 28 24 L28 26 L20 26 L20 24 C18 23, 16 20, 16 16 C16 10, 20 6, 24 6Z"
            fill={colorHex}
            fillOpacity="0.25"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          {/* Shoulders — narrow, angular */}
          <path
            d="M20 26 L12 32 L10 42 L38 42 L36 32 L28 26Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Hair detail — sharp bob */}
          <path
            d="M16 14 C16 8, 20 4, 24 4 C28 4, 32 8, 32 14 L30 12 C30 9, 28 6, 24 6 C20 6, 18 9, 18 12Z"
            fill={colorHex}
            fillOpacity="0.2"
          />
        </svg>
      );

    case 'slim':
      // Сайпл — thin, wiry
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — elongated */}
          <ellipse cx="24" cy="16" rx="7" ry="9" fill={colorHex} fillOpacity="0.25" stroke={colorHex} strokeWidth="1" strokeOpacity="0.6" />
          {/* Shoulders — narrow */}
          <path
            d="M17 25 L14 30 L12 42 L36 42 L34 30 L31 25Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Hair — slicked back */}
          <path
            d="M17 12 C17 7, 20 4, 24 4 C28 4, 31 7, 31 12 L29 11 C29 8, 27 6, 24 6 C21 6, 19 8, 19 11Z"
            fill={colorHex}
            fillOpacity="0.2"
          />
        </svg>
      );

    case 'broad':
      // Плантуш — wide, solid
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — square-ish */}
          <rect x="16" y="6" width="16" height="18" rx="5" fill={colorHex} fillOpacity="0.25" stroke={colorHex} strokeWidth="1" strokeOpacity="0.6" />
          {/* Shoulders — very broad */}
          <path
            d="M16 24 L6 32 L4 42 L44 42 L42 32 L32 24Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Flat top head */}
          <rect x="17" y="4" width="14" height="4" rx="2" fill={colorHex} fillOpacity="0.2" />
        </svg>
      );

    case 'tall':
      // Грог — tall, imposing
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — tall oval */}
          <ellipse cx="24" cy="14" rx="7" ry="10" fill={colorHex} fillOpacity="0.25" stroke={colorHex} strokeWidth="1" strokeOpacity="0.6" />
          {/* Shoulders — wide, strong */}
          <path
            d="M17 24 L8 31 L6 42 L42 42 L40 31 L31 24Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Mohawk / tall hair */}
          <path
            d="M22 4 L24 1 L26 4Z" fill={colorHex} fillOpacity="0.3" />
        </svg>
      );

    case 'round':
      // Тапер — round, soft
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — round */}
          <circle cx="24" cy="16" r="9" fill={colorHex} fillOpacity="0.25" stroke={colorHex} strokeWidth="1" strokeOpacity="0.6" />
          {/* Shoulders — round, medium */}
          <path
            d="M15 25 L10 31 L8 42 L40 42 L38 31 L33 25Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Fluffy hair */}
          <ellipse cx="24" cy="8" rx="9" ry="5" fill={colorHex} fillOpacity="0.2" />
        </svg>
      );

    case 'standard':
    default:
      // Нодрик — standard proportions, confident
      return (
        <svg viewBox="0 0 48 48" width="48" height="48" className="character-portrait-svg">
          {/* Head — standard oval */}
          <ellipse cx="24" cy="15" rx="8" ry="9" fill={colorHex} fillOpacity="0.25" stroke={colorHex} strokeWidth="1" strokeOpacity="0.6" />
          {/* Shoulders — standard */}
          <path
            d="M16 24 L10 31 L8 42 L40 42 L38 31 L32 24Z"
            fill={colorHex}
            fillOpacity="0.15"
            stroke={colorHex}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Short hair */}
          <path
            d="M16 12 C16 7, 19 4, 24 4 C29 4, 32 7, 32 12 C32 10, 29 8, 24 8 C19 8, 16 10, 16 12Z"
            fill={colorHex}
            fillOpacity="0.2"
          />
        </svg>
      );
  }
}

interface CharacterPortraitProps {
  textLines: string[];
}

export function CharacterPortrait({ textLines }: CharacterPortraitProps) {
  const character = useMemo(() => findCharacterInText(textLines), [textLines]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (character) {
      // Small delay for fade-in effect
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [character]);

  if (!character) return null;

  return (
    <div
      className={`absolute top-0 right-0 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      title={character.name}
    >
      <CharacterSVG character={character} />
      <div
        className={`text-center text-[10px] font-mono mt-0.5 ${character.color} opacity-70`}
      >
        {character.name}
      </div>
    </div>
  );
}

/**
 * Inline version — small portrait + name shown next to dialogue lines.
 * Returns portrait element or null.
 */
export function InlineCharacterPortrait({ characterName }: { characterName: string }) {
  const character = CHARACTERS.find(c => c.name === characterName);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [characterName]);

  if (!character) return null;

  return (
    <div className={`inline-flex items-center gap-1 mr-1 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-6 h-6 flex-shrink-0">
        <CharacterSVG character={character} />
      </div>
    </div>
  );
}

export { findCharacterInText, CharacterSVG };