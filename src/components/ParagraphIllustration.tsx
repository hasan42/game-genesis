import { useState } from 'react';
import { getIllustrationPath, getIllustrationName } from '../engine/illustrations';

interface ParagraphIllustrationProps {
  paragraphId: number;
}

export default function ParagraphIllustration({ paragraphId }: ParagraphIllustrationProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imagePath = getIllustrationPath(paragraphId);
  const name = getIllustrationName(paragraphId);

  if (!imagePath || error) return null;

  // Alt text based on illustration name
  const altTexts: Record<string, string> = {
    'station-exterior': 'Исследовательская станция на Ледхоме',
    'phoenixoid': 'Фениксоид',
    'spaceport': 'Космодром',
    'mine-tunnel': 'Шахты',
    'station-interior': 'Интерьер станции',
    'blizzard-surface': 'Вьюга на поверхности',
  };

  return (
    <div className="relative w-full mb-4 rounded-lg overflow-hidden">
      {/* Placeholder while loading */}
      {!loaded && (
        <div className="w-full h-48 bg-frost-900/50 animate-pulse flex items-center justify-center">
          <span className="text-frost-600 text-sm">❄ Загрузка иллюстрации…</span>
        </div>
      )}
      
      <img
        src={imagePath}
        alt={name ? altTexts[name] || name : 'Иллюстрация'}
        className={`w-full h-auto object-cover rounded-lg transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0 absolute top-0'
        }`}
        style={{ maxHeight: '320px' }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      
      {/* Gradient overlay at bottom for text readability */}
      {loaded && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}