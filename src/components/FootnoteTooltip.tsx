import { useState } from 'react';

// Lore data for key terms — hardcoded from game prologue/knowledge
const LORE_DATA: Record<string, string> = {
  'тикланцы': 'Воинственная инопланетная раса. Живут в ульях с несколькими уровнями — тиками. Изобрели генераторы Т-поля, отключающие электронику и лучевое оружие.',
  'тиланцы': 'Воинственная инопланетная раса. Живут в ульях с несколькими уровнями — тиками. Изобрели генераторы Т-поля, отключающие электронику и лучевое оружие.',
  'тилан': 'Улей тикланцев. Имеет несколько уровней — тиков. Воины с нижних ярусов отличаются особой свирепостью.',
  'микард': 'Раса нейтральных по отношению к землянам инопланетян. Их транспортные корабли — грузовозы.',
  'микарда': 'Раса нейтральных по отношению к землянам инопланетян. Их транспортные корабли — грузовозы.',
  'микарде': 'Планета или раса микардцев — нейтральных инопланетян.',
  'микардцев': 'Представители расы микарда — нейтральных по отношению к землянам инопланетян.',
  'кноп': 'Инопланетная раса, представители которой работают советниками и специалистами по качеству керамнита на станции Ледхома.',
  'кнопов': 'Представители инопланетной расы кнопов — советники и специалисты по керамниту.',
  'кнопа': 'Представитель инопланетной расы кнопов.',
  'фениксоид': 'Опасное инопланетное существо. Крупный хищник с хвостом и лапами, атакует в ближнем бою.',
  'паладины': 'Элитные воины Земной Федерации, космодесантники высшего ранга.',
  'паладин': 'Элитный воин Земной Федерации, космодесантник высшего ранга.',
  'керамнит': 'Редкий элемент, добываемый на буровой станции Ледхома. Необходим для производства космических кораблей.',
  'Т-поле': 'Генераторы Т-поля, изобретённые тикланцами. При включении отключают электронику, лучевое и огнестрельное оружие, сводя бой к холодному оружию.',
  'Ледхом': 'Планета-морозилка, где расположена буровая станция. Температура летом — минус тридцать.',
  'космодесант': 'Воинское подразделение Земной Федерации. Служба даёт право на переселение после увольнения.',
  'Кремень': 'Главный герой — уроженец планеты Кремень, бывший космодесантник, ветеран войны с тикланцами. Ксенофоб, физически силён.',
};

// Find lore terms in a text string and return segments with markers
export function findLoreTerms(text: string): { text: string; term?: string; definition?: string }[] {
  const segments: { text: string; term?: string; definition?: string }[] = [];
  let remaining = text;
  let pos = 0;

  while (remaining.length > 0) {
    let earliestMatch: { term: string; definition: string; index: number } | null = null;

    for (const [term, definition] of Object.entries(LORE_DATA)) {
      const idx = remaining.toLowerCase().indexOf(term.toLowerCase());
      if (idx !== -1) {
        if (!earliestMatch || idx < earliestMatch.index) {
          earliestMatch = { term, definition, index: idx };
        }
      }
    }

    if (!earliestMatch) {
      segments.push({ text: remaining });
      break;
    }

    // Text before the match
    if (earliestMatch.index > 0) {
      segments.push({ text: remaining.slice(0, earliestMatch.index) });
    }

    // The matched term (preserve original casing)
    const originalTerm = remaining.slice(earliestMatch.index, earliestMatch.index + earliestMatch.term.length);
    segments.push({
      text: originalTerm,
      term: earliestMatch.term,
      definition: earliestMatch.definition,
    });

    pos += earliestMatch.index + earliestMatch.term.length;
    remaining = remaining.slice(earliestMatch.index + earliestMatch.term.length);
  }

  return segments;
}

export function FootnoteTooltip({ term, definition }: { term: string; definition: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline">
      <button
        className="inline-flex items-center text-ice-400/70 hover:text-ice-300 text-xs ml-0.5 align-super transition-colors"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label={`Подсказка: ${term}`}
        type="button"
      >
        [?]
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 bg-frost-900 border border-ice-700/50 rounded-lg p-3 shadow-xl z-[70] pointer-events-none">
          <div className="text-ice-300 text-xs font-bold mb-1">{term}</div>
          <div className="text-frost-300 text-xs leading-relaxed">{definition}</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-frost-900" />
        </div>
      )}
    </span>
  );
}