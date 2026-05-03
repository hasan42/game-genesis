# Генерация AI-иллюстраций для game-genesis

## Модели

### Вариант 1: Ollama (локально, нужен мощный ПК)
Требуется ≥16 GB VRAM. На Mac mini 16GB не хватило — нужен второй ПК.

```bash
# Установить модель
ollama pull x/z-image-turbo:fp8

# Генерация одной картинки
ollama run x/z-image-turbo:fp8 "промпт здесь"

# Картинка сохраняется в текущую директорию
```

### Вариант 2: Pollinations.ai (бесплатно, через интернет, без API ключа)
Работает на любом ПК, но rate limit — 1 запрос за раз, ~15 сек между запросами.

```bash
curl -sL -o output.jpg "https://image.pollinations.ai/prompt/ENCODED_PROMPT?width=1024&height=576&nologo=true&seed=42"
```

### Вариант 3: Hugging Face Inference API (нужен бесплатный API ключ)
1. Зарегистрируйся на https://huggingface.co/
2. Получи API ключ в Settings → Access Tokens
3. pip install huggingface_hub
4. hf auth login

## Промпты для генерации

Все промпты на английском — модели лучше понимают английский. Стиль: dark sci-fi concept art.

### Основные сцены (уже сгенерированы ✅)

| Файл | Промпт |
|------|--------|
| station-exterior | `Dark sci-fi concept art: a massive research station on a frozen ice planet, brutalist architecture covered in ice and snow, blizzard raging, cold blue tones, dramatic lighting from within, cinematic, no text no watermark` |
| phoenixoid | `Dark sci-fi creature concept art: a terrifying phoenixoid alien monster, chitinous armor plates, multiple limbs with sharp claws, glowing red eyes, biomechanical horror, dark background, cinematic, no text no watermark` |
| spaceport | `Dark sci-fi concept art: an abandoned spaceport on a frozen planet, crashed spacecraft in snow, ruined launch pad, ice-covered structures, eerie red emergency lights, cold atmosphere, cinematic, no text no watermark` |
| mine-tunnel | `Dark sci-fi concept art: underground mine tunnels on an ice planet, narrow passages carved through blue crystalline rock, dim emergency lighting, ice crystals on walls, claustrophobic atmosphere, cinematic, no text no watermark` |
| station-interior | `Dark sci-fi concept art: interior of a research station on an ice planet, metal corridors with flickering lights, emergency red alarms, frost on walls, abandoned medical bay, cinematic, no text no watermark` |
| blizzard-surface | `Dark sci-fi concept art: a person walking through a violent blizzard on an ice planet, barely visible figure in heavy winter gear, snow and ice particles flying, zero visibility, dramatic cold blue tones, cinematic, no text no watermark` |

### Дополнительные сцены (сгенерированы ✅)

| Файл | Промпт | Параграфы |
|------|--------|-----------|
| medical-bay | ✅ | `Dark sci-fi concept art: abandoned medical bay on an ice planet station, broken medical equipment, scattered medicine vials, flickering fluorescent lights, blood stains on floor, cold blue and red tones, cinematic, no text no watermark` | 7, 38, 52 |
| command-center | ✅ | `Dark sci-fi concept art: command center of an ice planet research station, holographic displays flickering, captain chair empty, snow visible through reinforced windows, red alert lights, cinematic, no text no watermark` | 34, 35, 102 |
| trap-phoenixoid | ✅ | `Dark sci-fi concept art: a trap set for an alien creature in an ice station, bait in a flooded basin area, heavy metal doors ready to close, tension and danger, cold blue and red emergency lights, cinematic, no text no watermark` | 27, 76 |
| characters-group | ✅ | `Dark sci-fi character lineup concept art: six people in cold weather gear at an ice planet station, diverse ages and builds, tense expressions, dim emergency lighting, cold blue tones, cinematic, no text no watermark` | 3, 4 |
| glider-vehicle | ✅ | `Dark sci-fi concept art: a hover glider vehicle parked on an ice planet surface, sleek design with ice crystals forming on hull, blizzard in background, cold blue and white tones, cinematic, no text no watermark` | 58, 114 |
| ice-crevasse | ✅ | `Dark sci-fi concept art: a deep ice crevasse on an alien frozen planet, dangerous narrow bridge of ice, blue crystalline walls descending into darkness, a figure carefully crossing, cinematic, no text no watermark` | 150, 173 |
| t-field-barrier | ✅ | `Dark sci-fi concept art: an invisible force field barrier shimmering with faint blue light on a frozen ice planet, energy distortion in the air, snow particles being deflected, mysterious and alien technology, cinematic, no text no watermark` | 1, 3 |
| fight-corridor | ✅ | `Dark sci-fi concept art: a fierce battle in a narrow ice station corridor, person with glowing sword fighting a terrifying alien creature, sparks and ice fragments flying, emergency red lights, cinematic, no text no watermark` | 6, 7 |
| frozen-ruins | ✅ | `Dark sci-fi concept art: ruins of an ancient alien civilization buried in ice on a frozen planet, mysterious crystalline structures partially uncovered, eerie blue glow from within, archaeologist examining, cinematic, no text no watermark` | 93, 133 |
| spaceport-ship | ✅ | `Dark sci-fi concept art: a small spacecraft inside a frozen hangar on an ice planet, ice crystals on the hull, dim emergency lighting, frost on cockpit windows, the only way off the planet, cinematic, no text no watermark` | 192, 198 |

## Параметры генерации

- **Размер**: 1024x576 (16:9, хорошо для header image)
- **Seed**: фиксированный (для воспроизводимости) — менять seed если результат не нравится
- **Стиль**: всегда добавляй `cinematic, no text no watermark` в конец промпта
- **Формат**: JPG (меньше размер, качество достаточное)

## Как запускать

### Ollama (на мощном ПК):
```bash
cd /path/to/game-genesis/src/assets/illustrations
ollama run x/z-image-turbo:fp8 "ПРОМПТ"
# Файл сохраняется как.png в текущей директории
# Переименуй в нужное имя: mv output.png station-exterior.jpg
```

### Pollinations (на любом ПК):
```bash
cd /path/to/game-genesis/src/assets/illustrations
curl -sL -o ИМЯ.jpg "https://image.pollinations.ai/prompt/URL_ENCODED_PROMPT?width=1024&height=576&nologo=true&seed=42"
```

### Скрипт Python (для批量 генерации):
```bash
cd /path/to/game-genesis
python3 scripts/generate-illustrations.py
```

## Структура файлов

```
public/illustrations/     ← Vite раздаёт эти файлы напрямую
  station-exterior.jpg
  phoenixoid.jpg
  spaceport.jpg
  mine-tunnel.jpg
  station-interior.jpg
  blizzard-surface.jpg

src/assets/illustrations/ ← исходники (backup)
src/engine/illustrations.ts ← маппинг параграф → иллюстрация
src/components/ParagraphIllustration.tsx ← React компонент
```