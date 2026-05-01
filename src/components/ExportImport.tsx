import { useGameStore } from '../engine/store';

const STORAGE_KEY = 'game-genesis-save';

export function ExportImportButtons() {
  const handleExport = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        alert('Нет сохранения для экспорта');
        return;
      }
      const blob = new Blob([saved], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genesis-save-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Ошибка экспорта');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        // Basic validation
        if (!parsed.currentParagraph || !parsed.stats || !parsed.history) {
          alert('Неверный формат файла сохранения');
          return;
        }
        localStorage.setItem(STORAGE_KEY, text);
        // Load into store
        const loadGame = useGameStore.getState().loadGame;
        if (loadGame()) {
          alert('Сохранение загружено!');
        } else {
          alert('Ошибка загрузки сохранения');
        }
      } catch {
        alert('Ошибка чтения файла');
      }
    };
    input.click();
  };

  return (
    <div className="flex gap-3 items-center justify-center">
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-frost-800/60 hover:bg-frost-700/60 border border-frost-700/50 text-frost-300 rounded-lg text-sm transition-colors"
      >
        📤 Экспорт
      </button>
      <button
        onClick={handleImport}
        className="px-4 py-2 bg-frost-800/60 hover:bg-frost-700/60 border border-frost-700/50 text-frost-300 rounded-lg text-sm transition-colors"
      >
        📥 Импорт
      </button>
    </div>
  );
}