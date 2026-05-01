/**
 * Парсер книги-игры «Генезис» из HTML в JSON
 * Запуск: node scripts/parse-book.cjs
 * Результат: src/data/game-data.json
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.env.HOME || '/Users/rustampokosov', 'Downloads', 'only-text.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

function parseGame() {
  // Each paragraph is inside a <a name="tN"></a> section that contains a <span id="p_NNN">
  // Sections are delimited by <a name="tN"></a> markers
  // The paragraph number comes from <span id="p_NNN">
  
  // Find all t-section boundaries
  const tAnchorRegex = /<a\s+name="t(\d+)"><\/a>/g;
  const sections = [];
  let m;
  while ((m = tAnchorRegex.exec(html)) !== null) {
    sections.push({ pos: m.index, tId: parseInt(m[1]) });
  }
  
  const paragraphs = [];
  const prologues = [];
  
  for (let i = 0; i < sections.length; i++) {
    const start = html.indexOf('>', sections[i].pos) + 1;
    const end = i + 1 < sections.length ? sections[i + 1].pos : html.length;
    const sectionHtml = html.substring(start, end);
    
    // Check if this section contains a game paragraph (span id="p_NNN")
    const pMatch = sectionHtml.match(/<span\s+id="p_(\d+)">/);
    
    if (pMatch) {
      const pId = parseInt(pMatch[1]);
      const paragraph = parseParagraph(pId, sectionHtml);
      paragraphs.push(paragraph);
    } else {
      // This is a prologue/intro section (t1=prologue, t2=rules, t3=pre-story)
      const titleMatch = sectionHtml.match(/<h3\s+class="book">\s*([\s\S]*?)<\/h3>/);
      const title = titleMatch ? cleanHtml(titleMatch[1]).trim() : `Section ${sections[i].tId}`;
      const textBlocks = extractTextBlocks(sectionHtml);
      prologues.push({ tId: sections[i].tId, title, text: textBlocks });
    }
  }
  
  return { paragraphs, prologues };
}

function parseParagraph(id, sectionHtml) {
  const choices = [];
  const effects = [];
  const keywords = [];
  const keywordRemoves = [];
  const conditionalChoices = [];
  const textParts = [];
  
  // Title from span
  const titleMatch = sectionHtml.match(/<span\s+id="p_\d+">(.*?)<\/span>/);
  const title = titleMatch ? cleanHtml(titleMatch[1]).trim() : null;
  
  // Extract all <p class="book"> blocks
  const allText = extractTextBlocks(sectionHtml);
  
  // Combine all text blocks into one string for better conditional matching
  // (some conditions span multiple <p> blocks)
  const combinedCleaned = allText.join('\n');
  
  // Now parse the raw section for choices, effects, keywords, conditions
  const pRegex = /<p\s+class="book">([\s\S]*?)<\/p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(sectionHtml)) !== null) {
    const raw = pMatch[1];
    const cleaned = cleanHtml(raw).trim();
    if (!cleaned) continue;
    
    // Parse effects (from individual blocks)
    parseEffects(cleaned, effects);
    
    // Parse keywords (from individual blocks)
    parseKeywords(cleaned, keywords, keywordRemoves);
    
    textParts.push(cleaned);
  }
  
  // Parse choices and conditionals from the COMBINED text
  // This handles cases where conditions span multiple <p> blocks
  parseChoices(sectionHtml, combinedCleaned, choices, conditionalChoices);

  // Detect narrative death paragraphs (no choices, death-related text)
  // These should trigger the death screen, not victory
  if (choices.length === 0 && conditionalChoices.length === 0) {
    const deathWords = ['смерть', 'гибел', 'погиб', 'умер', 'умира', 'убит', 'мертв', 'мгновенн', 'конец в', 'вас больше нет'];
    const textLower = combinedCleaned.toLowerCase();
    if (deathWords.some(w => textLower.includes(w))) {
      effects.push({ type: 'set_health', value: 0 });
    }
  }

  return {
    id,
    title,
    text: textParts,
    choices,
    conditionalChoices,
    effects,
    keywords,
    keywordRemoves,
  };
}

function extractTextBlocks(sectionHtml) {
  const blocks = [];
  const pRegex = /<p\s+class="book">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRegex.exec(sectionHtml)) !== null) {
    const cleaned = cleanHtml(m[1]).trim();
    if (cleaned) blocks.push(cleaned);
  }
  return blocks;
}

function parseEffects(cleaned, effects) {
  let m;

  // ═══════════════════════════════════════
  // HEALTH EFFECTS
  // ═══════════════════════════════════════

  // "потеряйте N ЗДОРОВЬЯ" — the most common health decrease pattern (~29 occurrences)
  const loseHealthRegex = /потеряйте\s+(\d+)\s+ЗДОРОВЬЯ/gi;
  while ((m = loseHealthRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'decrease', stat: 'health', value: parseInt(m[1]) });
  }

  // "Уменьшите ЗДОРОВЬЕ на N"
  const decreaseHealthRegex = /Уменьшите\s+ЗДОРОВЬЕ\s+на\s+(\d+)/gi;
  while ((m = decreaseHealthRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'decrease', stat: 'health', value: parseInt(m[1]) });
  }

  // "Вычтите N из ЗДОРОВЬЯ"
  const subtractRegex = /Вычтите\s+(\d+)\s+из\s+ЗДОРОВЬЯ/gi;
  while ((m = subtractRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'decrease', stat: 'health', value: parseInt(m[1]) });
  }

  // "ЗДОРОВЬЕ увеличивается на N" / "ЗДОРОВЬЕ восстанавливается на N"
  const restoreRegex = /ЗДОРОВЬЕ\s+(?:увеличивается|восстанавливается)\s+на\s+(\d+)/gi;
  while ((m = restoreRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'increase', stat: 'health', value: parseInt(m[1]) });
  }

  // ═══════════════════════════════════════
  // AURA EFFECTS
  // ═══════════════════════════════════════

  // "Увеличьте АУРУ на N" / "увеличьте АУРУ на N" / "Увеличьте свою АУРУ на N" / "увеличьте свою АУРУ на N"
  const increaseAuraRegex = /[Уу]величьте\s+(?:свою\s+)?АУРУ\s+на\s+(\d+)/g;
  while ((m = increaseAuraRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'increase', stat: 'aura', value: parseInt(m[1]) });
  }

  // "Уменьшите АУРУ на N" / "уменьшите АУРУ на N" / "Уменьшите свою АУРУ на N" / "уменьшите свою АУРУ на N"
  const decreaseAuraRegex = /[Уу]меньшите\s+(?:свою\s+)?АУРУ?\s+на\s+(\d+)/g;
  while ((m = decreaseAuraRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'decrease', stat: 'aura', value: parseInt(m[1]) });
  }

  // ═══════════════════════════════════════
  // AGILITY / STEALTH / MELEE EFFECTS
  // ═══════════════════════════════════════

  // "Уменьшите СТЕЛС и ЛОВКОСТЬ на N" (dual effect)
  const decreaseDualRegex = /[Уу]меньшите\s+СТЕЛС\s+и\s+ЛОВКОСТЬ\s+на\s+(\d+)/g;
  while ((m = decreaseDualRegex.exec(cleaned)) !== null) {
    const val = parseInt(m[1]);
    effects.push({ type: 'decrease', stat: 'stealth', value: val });
    effects.push({ type: 'decrease', stat: 'agility', value: val });
  }

  // Generic: "Уменьшите/увеличьте <STAT> на N" for capitalized stat names
  // Covers: ЛОВКОСТЬ, СТЕЛС, ХОЛОДНОЕ ОРУЖИЕ, etc.
  const genericDecreaseRegex = /[Уу]меньшите\s+(?:свой\s+)?(?:свою\s+)?([А-ЯЁ]{2,}(?:\s+[А-ЯЁ]{2,})?)\s+на\s+(\d+)/g;
  while ((m = genericDecreaseRegex.exec(cleaned)) !== null) {
    const stat = normalizeStat(m[1]);
    // Skip if already caught by specific patterns (aura, health, dual)
    if (stat === 'aura' || stat === 'health') continue;
    // Skip dual pattern already handled
    if (/СТЕЛС\s+и\s+ЛОВКОСТЬ/.test(m[1])) continue;
    effects.push({ type: 'decrease', stat, value: parseInt(m[2]) });
  }

  const genericIncreaseRegex = /[Уу]величьте\s+(?:свой\s+)?(?:свою\s+)?([А-ЯЁ]{2,}(?:\s+[А-ЯЁ]{2,})?)\s+на\s+(\d+)/g;
  while ((m = genericIncreaseRegex.exec(cleaned)) !== null) {
    const stat = normalizeStat(m[1]);
    if (stat === 'aura' || stat === 'health') continue;
    effects.push({ type: 'increase', stat, value: parseInt(m[2]) });
  }

  // "Прибавьте N к <STAT>" (e.g., "Прибавьте 1 к АПТЕЧКЕ", "Прибавьте N к ЛОВКОСТИ")
  const addToRegex = /Прибавьте\s+(\d+)\s+к\s+([А-ЯЁ]{2,}(?:[А-ЯЁ]*)?)/g;
  while ((m = addToRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'increase', stat: normalizeStat(m[2]), value: parseInt(m[1]) });
  }

  // "Прибавьте себе N АПТЕЧКИ" (e.g., "прибавьте себе 2 АПТЕЧКИ")
  const addSelfMedkitRegex = /прибавьте\s+себе\s+(\d+)\s+АПТЕЧК/gi;
  while ((m = addSelfMedkitRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'add_medkit', value: parseInt(m[1]) });
  }

  // ═══════════════════════════════════════
  // MEDKIT EFFECTS
  // ═══════════════════════════════════════

  // "прибавьте N аптечк..." (e.g., "прибавьте 1 аптечку, найденную в багажнике")
  const medkitRegex = /прибавьте\s+(\d+)\s+аптечк/gi;
  while ((m = medkitRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'add_medkit', value: parseInt(m[1]) });
  }

  // "минус N АПТЕЧКА" / "минус N АПТЕЧКИ"
  const minusMedkitRegex = /минус\s+(\d+)\s+АПТЕЧК/gi;
  while ((m = minusMedkitRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'use_medkit', value: parseInt(m[1]) });
  }

  // "потратьте/используйте N АПТЕЧКУ/АПТЕЧКИ" (if such pattern appears)
  const spendMedkitRegex = /(?:потратить|потратьте|использовать|используйте)\s+(\d+)\s+АПТЕЧК/gi;
  while ((m = spendMedkitRegex.exec(cleaned)) !== null) {
    effects.push({ type: 'use_medkit', value: parseInt(m[1]) });
  }
}

function parseKeywords(cleaned, keywords, keywordRemoves) {
  let m;

  // ═══════════════════════════════════════
  // ADD KEYWORDS
  // ═══════════════════════════════════════

  // "Запишите ключевые слова «X», «Y» и «Z»" (multiple keywords, comma/и separated)
  const multiKwAddRegex = /Запишите\s+ключевые\s+слова\s+(.+?)(?:\s*[.()]|$)/gi;
  while ((m = multiKwAddRegex.exec(cleaned)) !== null) {
    const kwItemRegex = /«([^»]+)»/g;
    let km;
    while ((km = kwItemRegex.exec(m[1])) !== null) {
      if (!keywords.includes(km[1])) {
        keywords.push(km[1].toLowerCase());
      }
    }
  }

  // "Запишите ключевое слово «X»" (single keyword)
  const addRegex = /Запишите\s+ключевое\s+слово\s+«([^»]+)»/gi;
  while ((m = addRegex.exec(cleaned)) !== null) {
    if (!keywords.includes(m[1])) {
      keywords.push(m[1].toLowerCase());
    }
  }

  // "Запишите слово «X»" (without "ключевое")
  const addWordRegex = /Запишите\s+слово\s+«([^»]+)»/gi;
  while ((m = addWordRegex.exec(cleaned)) !== null) {
    if (!keywords.includes(m[1])) {
      keywords.push(m[1].toLowerCase());
    }
  }

  // "Запишите в ключевые слова «X»"
  const addToKwRegex = /Запишите\s+в\s+ключевые\s+слова\s+«([^»]+)»/gi;
  while ((m = addToKwRegex.exec(cleaned)) !== null) {
    if (!keywords.includes(m[1])) {
      keywords.push(m[1].toLowerCase());
    }
  }

  // ═══════════════════════════════════════
  // REMOVE KEYWORDS
  // ═══════════════════════════════════════

  // "Вычеркните ключевое слово «X»" / "Вычеркните ключевое слово «X» из списка"
  const removeRegex = /Вычеркните\s+ключевое\s+слово\s+«([^»]+)»/gi;
  while ((m = removeRegex.exec(cleaned)) !== null) {
    if (!keywordRemoves.includes(m[1])) {
      keywordRemoves.push(m[1].toLowerCase());
    }
  }

  // "Вычеркните из ключевых слов «X»" / "Вычеркните из списка ключевых слов «X»"
  const removeFromListRegex = /Вычеркните\s+из\s+(?:списка\s+)?ключевых\s+слов\s+«([^»]+)»/gi;
  while ((m = removeFromListRegex.exec(cleaned)) !== null) {
    if (!keywordRemoves.includes(m[1])) {
      keywordRemoves.push(m[1].toLowerCase());
    }
  }

  // "вычеркните «X»" (short form, e.g., "вычеркните «ратрак»")
  const removeShortRegex = /вычеркните\s+«([^»]+)»/gi;
  while ((m = removeShortRegex.exec(cleaned)) !== null) {
    if (!keywordRemoves.includes(m[1])) {
      keywordRemoves.push(m[1].toLowerCase());
    }
  }

  // "Если у вас записано слово «X», вычеркните его" — the removal happens conditionally
  // This is tricky: the removal is inside a conditional, so we'll note it as a conditional effect
  // For now, we add it to keywordRemoves (engine can decide)
  const condRemoveRegex = /Если\s+у\s+вас\s+записано\s+(?:ключевое\s+слово\s+|слово\s+)?«([^»]+)»[^—]*вычеркните\s+(?:его|её|их)/gi;
  while ((m = condRemoveRegex.exec(cleaned)) !== null) {
    if (!keywordRemoves.includes(m[1])) {
      keywordRemoves.push(m[1].toLowerCase());
    }
  }
}

function parseChoices(raw, cleaned, choices, conditionalChoices) {
  // Extract links: <a href="...#p_NNN" ...>NNN</a>
  const hrefRegex = /<a\s+href="[^"]*#p_(\d+)"[^>]*>(\d+)<\/a>/g;
  const links = [];
  let m;
  while ((m = hrefRegex.exec(raw)) !== null) {
    links.push({ paragraph: parseInt(m[1]), text: m[2] });
  }
  
  if (links.length === 0) return;

  // Track if we found a conditional match (but still parse regular choices at the end)
  let matched = false;

  // ═══════════════════════════════════════
  // STAT CHECK PATTERNS
  // ═══════════════════════════════════════

  // Pattern: "Если ваша ЛОВКОСТЬ 32 или больше, а ЗДОРОВЬЕ не меньше 20 — (179), если хотя бы один из параметров ниже — (2)"
  const dualStatRegex = /Если\s+ваш[аие]?\s+([А-ЯЁ]{2,}(?:[А-ЯЁ]*))\s+(\d+)\s+(?:или\s+больше|или\s+выше|больше|выше)\s*,\s*а\s+([А-ЯЁ]{2,}(?:[А-ЯЁ]*))\s+не\s+меньше\s+(\d+)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:хотя\s+бы\s+один\s+из\s+параметров\s+ниже|хотя\s+бы\s+один\s+параметр\s+меньше)\s*[—–-]\s*\((\d+)\)/i;
  const dualMatch = cleaned.match(dualStatRegex);
  if (dualMatch) {
    conditionalChoices.push({
      type: 'dual_stat_check',
      stat1: normalizeStat(dualMatch[1]),
      threshold1: parseInt(dualMatch[2]),
      stat2: normalizeStat(dualMatch[3]),
      threshold2: parseInt(dualMatch[4]),
      successParagraph: parseInt(dualMatch[5]),
      failParagraph: parseInt(dualMatch[6]),
    });
    matched = true;
  }

  // Pattern: "Если ваша АУРА 7 или больше, а ключевых слов «ранение» не менее трех — (171), если хотя бы один параметр меньше — (162)"
  const auraKwRegex = /Если\s+ваш[аие]?\s+([А-ЯЁ]{2,}(?:[А-ЯЁ]*))\s+(\d+)\s+(?:или\s+больше|или\s+выше)\s*,\s*а\s+ключевых\s+слов\s+«([^»]+)»\s+не\s+менее\s+(\d+)\s*[—–-]*\s*\((\d+)\)\s*,\s*если\s+(?:хотя\s+бы\s+один\s+параметр\s+меньше)\s*[—–-]\s*\((\d+)\)/i;
  const auraKwMatch = cleaned.match(auraKwRegex);
  if (auraKwMatch) {
    conditionalChoices.push({
      type: 'stat_and_keyword_count_check',
      stat: normalizeStat(auraKwMatch[1]),
      statThreshold: parseInt(auraKwMatch[2]),
      keyword: normalizeKeyword(auraKwMatch[3]),
      keywordMinCount: parseInt(auraKwMatch[4]),
      successParagraph: parseInt(auraKwMatch[5]),
      failParagraph: parseInt(auraKwMatch[6]),
    });
    matched = true;
  }

  // Standard stat check — two sub-patterns:
  // A: "Если ваш СТЕЛС 5 или выше — (71), если нет — (174)"  (stat then number directly)
  // B: "Если ваш СТЕЛС равен 4 или больше — (111), если меньше — (84)"  (stat, 'равен', number)
  // C: "Если ваш параметр ХОЛОДНОЕ ОРУЖИЕ равен 18 или больше — (23), если нет — (137)"
  // D: "Если ваш параметр холодного оружия 17 или выше — (59), если нет — (168)"
  
  // Pattern B+C: stat name then 'равен' then number
  const statCheckRavenRegex = /Если\s+(?:ваш[аие]?\s+)?(?:параметр\s+)?([А-ЯЁA-Za-zА-яЁё]+(?:\s+[А-ЯЁA-Za-zА-яЁё]+)*)\s+равен\s+(\d+)\s+(?:или\s+выше|или\s+больше|или\s+равен\s+или\s+больше|больше|выше)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:нет|меньше|он[аио]?\s+ниже|он[аио]?\s+меньше)\s*[–—]*\s*\((\d+)\)/i;
  const statRavenMatch = cleaned.match(statCheckRavenRegex);
  if (statRavenMatch) {
    conditionalChoices.push({
      type: 'stat_check',
      stat: normalizeStat(statRavenMatch[1]),
      threshold: parseInt(statRavenMatch[2]),
      operator: 'gte',
      successParagraph: parseInt(statRavenMatch[3]),
      failParagraph: parseInt(statRavenMatch[4]),
    });
    matched = true;
  }
  
  // Pattern A+D: stat name then number directly (no 'равен')
  const statCheckDirectRegex = /Если\s+(?:ваш[аие]?\s+)?(?:параметр\s+)?([А-ЯЁA-Za-zА-яЁё]+(?:\s+[А-ЯЁA-Za-zА-яЁё]+)*)\s+(\d+)\s+(?:или\s+выше|или\s+больше|или\s+равен\s+или\s+больше|больше|выше)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:нет|меньше|он[аио]?\s+ниже|он[аио]?\s+меньше)\s*[–—]*\s*\((\d+)\)/i;
  const statDirectMatch = cleaned.match(statCheckDirectRegex);
  if (statDirectMatch) {
    conditionalChoices.push({
      type: 'stat_check',
      stat: normalizeStat(statDirectMatch[1]),
      threshold: parseInt(statDirectMatch[2]),
      operator: 'gte',
      successParagraph: parseInt(statDirectMatch[3]),
      failParagraph: parseInt(statDirectMatch[4]),
    });
    matched = true;
  }

  // Stat check with 'читайте дальше' instead of fail paragraph
  const statCheckContinueRegex = /Если\s+(?:ваш[аие]?\s+)?(?:параметр\s+)?([А-ЯЁA-Za-zА-яЁё]+(?:\s+[А-ЯЁA-Za-zА-яЁё]+)*)\s+(?:равен\s+)?(\d+)\s+(?:или\s+выше|или\s+больше|больше|выше)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:нет|меньше)[^]*/i;
  const statContinueMatch = cleaned.match(statCheckContinueRegex);
  if (statContinueMatch && !statDirectMatch && !statRavenMatch) {
    conditionalChoices.push({
      type: 'stat_check',
      stat: normalizeStat(statContinueMatch[1]),
      threshold: parseInt(statContinueMatch[2]),
      operator: 'gte',
      successParagraph: parseInt(statContinueMatch[3]),
      failParagraph: null, // "читайте дальше" — no specific paragraph
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // KEYWORD CHECK PATTERNS
  // ═══════════════════════════════════════

  // "Если у вас записано ключевое слово «X» — (N), если нет — (M)"
  const kwCheckRegex = /Если\s+у\s+вас\s+записано\s+ключевое\s+слово\s+«([^»]+)»\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+нет\s*[—–-]\s*\((\d+)\)/i;
  const kwMatch = cleaned.match(kwCheckRegex);
  if (kwMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwMatch[1]),
      hasParagraph: parseInt(kwMatch[2]),
      missingParagraph: parseInt(kwMatch[3]),
    });
    matched = true;
  }

  // "Если у вас записано слово «X» — (N), если нет — (M)" (without "ключевое")
  const kwWordCheckRegex = /Если\s+у\s+вас\s+записано\s+слово\s+«([^»]+)»\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+нет\s*[—–-]?\s*\((\d+)\)/i;
  const kwWordMatch = cleaned.match(kwWordCheckRegex);
  if (kwWordMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwWordMatch[1]),
      hasParagraph: parseInt(kwWordMatch[2]),
      missingParagraph: parseInt(kwWordMatch[3]),
    });
    matched = true;
  }

  // "Если у вас записано «X» — (N), если нет — (M)" (short form)
  // Also handles multi-line: «Если у вас записано «X» — (N).\nЕсли нет — (M)"
  const kwShortCheckRegex = /Если\s+у\s+вас\s+записано\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*[.,]?\s*\n?\s*Если\s+нет\s*[—–-]?\s*\((\d+)\)/i;
  const kwShortMatch = cleaned.match(kwShortCheckRegex);
  if (kwShortMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwShortMatch[1]),
      hasParagraph: parseInt(kwShortMatch[2]),
      missingParagraph: parseInt(kwShortMatch[3]),
    });
    matched = true;
  }

  // "Если у вас записано ключевое слово «X» — (N), если нет, возвращайтесь на M"
  const kwCheckReturnRegex = /Если\s+у\s+вас\s+записано\s+ключевое\s+слово\s+«([^»]+)»\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+нет\s*,\s*возвращайтесь\s+на\s+(\d+)/i;
  const kwReturnMatch = cleaned.match(kwCheckReturnRegex);
  if (kwReturnMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwReturnMatch[1]),
      hasParagraph: parseInt(kwReturnMatch[2]),
      missingParagraph: parseInt(kwReturnMatch[3]),
    });
    matched = true;
  }

  // Multi-keyword OR check: "Если у вас записано хотя бы одно из ключевых слов: «псих», «глайдер», ... — (N), если нет ни одного — (M)"
  const multiKwRegex = /Если\s+у\s+вас\s+записано\s+хотя\s+бы\s+одно\s+из\s+ключевых\s+слов:\s*(.+?)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+нет\s+ни\s+одного\s*[—–-]\s*\((\d+)\)/i;
  const multiKwMatch = cleaned.match(multiKwRegex);
  if (multiKwMatch) {
    const kwList = [];
    const kwItemRegex = /«([^»]+)»/g;
    let km;
    while ((km = kwItemRegex.exec(multiKwMatch[1])) !== null) {
      kwList.push(km[1]);
    }
    conditionalChoices.push({
      type: 'any_keyword_check',
      keywords: kwList,
      hasParagraph: parseInt(multiKwMatch[2]),
      missingParagraph: parseInt(multiKwMatch[3]),
    });
    matched = true;
  }

  // Multi-keyword OR (short form): "Если у вас записано одно из ключевых слов: «X» или «Y» — (N)"
  // Sometimes followed by "Если нет — (M)" on next line
  const multiKwShortRegex = /Если\s+у\s+вас\s+записано\s+одно\s+из\s+ключевых\s+слов:\s*(.+?)\s*[—–-]?\s*\((\d+)\)/i;
  const multiKwShortMatch = cleaned.match(multiKwShortRegex);
  if (multiKwShortMatch) {
    const kwList = [];
    const kwItemRegex = /«([^»]+)»/g;
    let km;
    while ((km = kwItemRegex.exec(multiKwShortMatch[1])) !== null) {
      kwList.push(km[1]);
    }
    // Check if next part has "Если нет — (M)"
    const nextLineMatch = cleaned.match(/Если\s+нет\s*[—–-]?\s*\((\d+)\)/i);
    conditionalChoices.push({
      type: 'any_keyword_check',
      keywords: kwList,
      hasParagraph: parseInt(multiKwShortMatch[2]),
      missingParagraph: nextLineMatch ? parseInt(nextLineMatch[1]) : null,
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // MULTI-BRANCH KEYWORD PATTERNS
  // ═══════════════════════════════════════

  // "Если у вас записано слово «ратрак», прочитайте — (69), если записано слово «инженер» — (11), если есть все эти ключевые слова, прочитайте по очереди оба параграфа. Если ни одного нет, то — (190)"
  // -> multi_keyword_branch
  const multiBranchRegex = /Если\s+у\s+вас\s+записано\s+(?:ключевое\s+)?слово\s+«([^»]+)»[^]*?прочитайте\s*[—–-]?\s*\((\d+)\)\s*,\s*если\s+записано\s+(?:ключевое\s+)?слово\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*,\s*если\s+есть\s+все\s+эти\s+ключевые\s+слова[^]*?Если\s+ни\s+одного\s+нет\s*[—–-]?\s*\((\d+)\)/i;
  const multiBranchMatch = cleaned.match(multiBranchRegex);
  if (multiBranchMatch) {
    const branches = [
      { keyword: normalizeKeyword(multiBranchMatch[1]), paragraph: parseInt(multiBranchMatch[2]) },
      { keyword: normalizeKeyword(multiBranchMatch[3]), paragraph: parseInt(multiBranchMatch[4]) },
    ];
    conditionalChoices.push({
      type: 'multi_keyword_branch',
      branches,
      noneParagraph: parseInt(multiBranchMatch[5]),
    });
    matched = true;
  }

  // "Если у вас записано слово «кран-балка» — (49), Если «контейнер» — (191), Если нет ни того, ни другого, ... — (148)"
  // -> keyword_branch with fallback
  const kwBranchRegex = /Если\s+у\s+вас\s+записано\s+(?:ключевое\s+)?слово\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*,?\s*Если\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*,?\s*Если\s+нет\s+ни\s+того,\s*ни\s+другого[^—]*[—–-]?\s*\((\d+)\)/i;
  const kwBranchMatch = cleaned.match(kwBranchRegex);
  if (kwBranchMatch) {
    conditionalChoices.push({
      type: 'multi_keyword_branch',
      branches: [
        { keyword: normalizeKeyword(kwBranchMatch[1]), paragraph: parseInt(kwBranchMatch[2]) },
        { keyword: normalizeKeyword(kwBranchMatch[3]), paragraph: parseInt(kwBranchMatch[4]) },
      ],
      noneParagraph: parseInt(kwBranchMatch[5]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // ITEM/KEYWORD PRESENCE CHECK (has sword, has keyword)
  // ═══════════════════════════════════════

  // "Если у вас есть меч — (N), если нет — (M)" / "Если у вас есть плазмоизлучатель — (N), если только меч — (M)"
  const itemCheckRegex = /Если\s+у\s+вас\s+есть\s+([^—–(]+?)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:нет|только\s+[^—(]+?)\s*[—–-]?\s*\((\d+)\)/i;
  const itemMatch = cleaned.match(itemCheckRegex);
  if (itemMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(itemMatch[1].trim()),
      hasParagraph: parseInt(itemMatch[2]),
      missingParagraph: parseInt(itemMatch[3]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // VEHICLE/KEYWORD-BASED CHOICE
  // ═══════════════════════════════════════

  // "Если вы приехали на снегоходе, то ... — (161), если на ратраке — (85)"
  const vehicleChoiceRegex = /Если\s+вы\s+приехали\s+на\s+([^,]+?),\s*то\s+[^—]*[—–-]\s*\((\d+)\)\s*,\s*если\s+на\s+([^—]+?)\s*[—–-]\s*\((\d+)\)/i;
  const vehicleMatch = cleaned.match(vehicleChoiceRegex);
  if (vehicleMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(vehicleMatch[1].trim()),
      hasParagraph: parseInt(vehicleMatch[2]),
      missingParagraph: parseInt(vehicleMatch[4]),
      altKeyword: normalizeKeyword(vehicleMatch[3].trim()),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // VISIT/ACTION STATE CHECK
  // ═══════════════════════════════════════

  // "Если вы еще не входили в открытую дверь — (193), если уже были там, то покидаете корабль — (70)"
  const visitCheckRegex = /Если\s+вы\s+ещ[ёе]\s+не\s+([^—]+?)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+уже\s+[^—]*?[—–-]\s*\((\d+)\)/i;
  const visitMatch = cleaned.match(visitCheckRegex);
  if (visitMatch) {
    conditionalChoices.push({
      type: 'visit_check',
      description: visitMatch[1].trim(),
      notVisitedParagraph: parseInt(visitMatch[2]),
      visitedParagraph: parseInt(visitMatch[3]),
    });
    matched = true;
  }

  // "Если вы еще не допрашивали Плантуша — (113), если уже делали это"
  const actionCheckRegex = /Если\s+вы\s+ещ[ёе]\s+не\s+([^—]+?)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+уже\s+делали\s+это/i;
  const actionMatch = cleaned.match(actionCheckRegex);
  if (actionMatch) {
    conditionalChoices.push({
      type: 'visit_check',
      description: actionMatch[1].trim(),
      notVisitedParagraph: parseInt(actionMatch[2]),
      visitedParagraph: null, // continues in current paragraph
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // KEYWORD-DRIVEN SCENARIO CHOICES
  // Moved to newer pattern below (after all other conditional patterns)
  // ═══════════════════════════════════════

  // ═══════════════════════════════════════
  // SINGLE KEYWORD/STATE BRANCH (no "если нет")
  // ═══════════════════════════════════════

  // "Если у вас записано слово «псих» — (66)" — single branch, no else
  const singleKwRegex = /Если\s+у\s+вас\s+записано\s+(?:ключевое\s+)?слово\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)/i;
  const singleKwMatch = cleaned.match(singleKwRegex);
  if (singleKwMatch && !kwMatch && !kwWordMatch && !kwShortMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(singleKwMatch[1]),
      hasParagraph: parseInt(singleKwMatch[2]),
      missingParagraph: null,
    });
    matched = true;
  }

  // "Если у вас записано «инженер» — (132), если нет — (24)" (short form without "слово/ключевое")
  const kwNoWordRegex = /Если\s+у\s+вас\s+записано\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*,\s*если\s+нет\s*[—–-]?\s*\((\d+)\)/i;
  const kwNoWordMatch = cleaned.match(kwNoWordRegex);
  if (kwNoWordMatch && !kwShortMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwNoWordMatch[1]),
      hasParagraph: parseInt(kwNoWordMatch[2]),
      missingParagraph: parseInt(kwNoWordMatch[3]),
    });
    matched = true;
  }

  // "Если у вас записано «ретранслятор» прочитайте — (3), если гиперзонд — (107)" — keyword A vs keyword B
  const kwEitherOrRegex = /Если\s+у\s+вас\s+записано\s+«([^»]+)»\s*прочитайте\s*[—–-]?\s*\((\d+)\)\s*,\s*если\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)/i;
  const kwEitherOrMatch = cleaned.match(kwEitherOrRegex);
  if (kwEitherOrMatch) {
    conditionalChoices.push({
      type: 'multi_keyword_branch',
      branches: [
        { keyword: normalizeKeyword(kwEitherOrMatch[1]), paragraph: parseInt(kwEitherOrMatch[2]) },
        { keyword: normalizeKeyword(kwEitherOrMatch[3]), paragraph: parseInt(kwEitherOrMatch[4]) },
      ],
      noneParagraph: null,
    });
    matched = true;
  }

  // "если все дела закончены — (102)" — generic state check
  const stateCheckRegex = /если\s+(?:все\s+дела\s+закончены|все\s+готово)\s*[—–-]?\s*\((\d+)\)/i;
  const stateMatch = cleaned.match(stateCheckRegex);
  if (stateMatch) {
    conditionalChoices.push({
      type: 'state_check',
      description: 'все дела закончены',
      paragraph: parseInt(stateMatch[1]),
    });
    matched = true;
  }

  // "Если хотите расспросить исина о крушении корабля микардцев — (56)" — optional action
  // "Если хотите присоединиться к нему и идти к ангару — (167). Если нет — (88)"
  const optionalActionRegex = /Если\s+хотите\s+([^—]+?)\s*[—–-]\s*\((\d+)\)\s*[.,]?\s*Если\s+нет\s*[—–-]?\s*\((\d+)\)/i;
  const optionalMatch = cleaned.match(optionalActionRegex);
  if (optionalMatch) {
    conditionalChoices.push({
      type: 'optional_action',
      description: optionalMatch[1].trim(),
      yesParagraph: parseInt(optionalMatch[2]),
      noParagraph: parseInt(optionalMatch[3]),
    });
    matched = true;
  }

  // "Если не хотите идти, можете отказаться — (83), если последуете за ней — (156)"
  const refuseOrFollowRegex = /Если\s+не\s+хотите\s+([^,]+?),\s+можете\s+отказаться\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+последуете\s+[^—]*?[—–-]\s*\((\d+)\)/i;
  const refuseMatch = cleaned.match(refuseOrFollowRegex);
  if (refuseMatch) {
    conditionalChoices.push({
      type: 'optional_action',
      description: refuseMatch[1].trim(),
      noParagraph: parseInt(refuseMatch[2]),
      yesParagraph: parseInt(refuseMatch[3]),
    });
    matched = true;
  }

  // "Если не хотите тратить на несчастного АПТЕЧКУ, можете сделать вид, что не заметили его, и проехать мимо — (42), а если решите помочь, читайте дальше."
  const medkitChoiceRegex = /Если\s+не\s+хотите\s+тратить\s+[^—]+?АПТЕЧКУ[^—]*?[—–-]\s*\((\d+)\)\s*,\s*а\s+если\s+решите\s+помочь/i;
  const medkitChoiceMatch = cleaned.match(medkitChoiceRegex);
  if (medkitChoiceMatch) {
    conditionalChoices.push({
      type: 'medkit_choice',
      refuseParagraph: parseInt(medkitChoiceMatch[1]),
      helpParagraph: null, // continue reading
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // STAT CHECK: «равен или больше N» (number after «больше», not after «равен»)
  // «Если ваш параметр холодного оружия равен или больше 17 — (196), если меньше — (33)"
  // ═══════════════════════════════════════
  const statCheckRavenOrRegex = /Если\s+(?:ваш[аие]?\s+)?(?:параметр\s+)?([А-ЯЁA-Za-zА-яЁё]+(?:\s+[А-ЯЁA-Za-zА-яЁё]+)*)\s+равен\s+или\s+больше\s+(\d+)\s*[—–-]\s*\((\d+)\)\s*,\s*если\s+(?:нет|меньше)\s*[–—]*\s*\((\d+)\)/i;
  const statRavenOrMatch = cleaned.match(statCheckRavenOrRegex);
  if (statRavenOrMatch) {
    conditionalChoices.push({
      type: 'stat_check',
      stat: normalizeStat(statRavenOrMatch[1]),
      threshold: parseInt(statRavenOrMatch[2]),
      operator: 'gte',
      successParagraph: parseInt(statRavenOrMatch[3]),
      failParagraph: parseInt(statRavenOrMatch[4]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // STAT + KEYWORD COUNT CHECK
  // «Если ваша АУРА 7 или больше, а ключевых слов «ранение» не менее трех — (171), если хотя бы один параметр меньше — (162)"
  // ═══════════════════════════════════════
  const statKwCountRegex = /Если\s+ваш[аие]?\s+([А-ЯЁ]+)\s+(\d+)\s+(?:или\s+больше|или\s+выше|больше|выше)\s*,\s*а\s+ключевых\s+слов\s+«([^»]+)»\s+не\s+менее\s+(трех|четырех|пяти|\d+)\s*[—–-]*\s*\((\d+)\)\s*,\s*если\s+(?:хотя\s+бы\s+один\s+параметр\s+меньше|хотя\s+бы\s+один\s+из\s+параметров\s+ниже)\s*[—–-]\s*\((\d+)\)/i;
  const statKwCountMatch = cleaned.match(statKwCountRegex);
  if (statKwCountMatch) {
    const wordToNum = { 'трех': 3, 'четырех': 4, 'пяти': 5 };
    const kwCount = wordToNum[statKwCountMatch[4]] || parseInt(statKwCountMatch[4]);
    conditionalChoices.push({
      type: 'stat_and_keyword_count_check',
      stat: normalizeStat(statKwCountMatch[1]),
      threshold: parseInt(statKwCountMatch[2]),
      keyword: normalizeKeyword(statKwCountMatch[3]),
      keywordMinCount: kwCount,
      successParagraph: parseInt(statKwCountMatch[5]),
      failParagraph: parseInt(statKwCountMatch[6]),
      description: `${statName(normalizeStat(statKwCountMatch[1]))} ≥ ${statKwCountMatch[2]} и «${statKwCountMatch[3]}» ≥ ${kwCount}`,
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // VISIT CHECK: «Если вы еще не были в X, то [действие] — (N) или [действие2] — (M); Если же все дела закончены — (K)"
  // e.g. P80: "Если вы еще не были в медпункте, то успеете сходить туда — (38) или поговорить с Плантушем... — (52); Если же все дела закончены — (102)"
  // ═══════════════════════════════════════
  const visitCheckAltRegex = /Если\s+вы\s+ещ[ёе]\s+не\s+были\s+в\s+([^,]+?),\s*то\s+[^—]*?[—–-]\s*\((\d+)\)\s+или\s+[^—]*?[—–-]\s*\((\d+)\)\s*[;,]?\s*\n?\s*Если\s+же\s+все\s+дела\s+закончены\s*[—–-]?\s*\((\d+)\)/i;
  const visitAltMatch = cleaned.match(visitCheckAltRegex);
  if (visitAltMatch) {
    // Two optional destinations + state check
    conditionalChoices.push({
      type: 'visit_check',
      description: `ещё не были в ${visitAltMatch[1].trim()}`,
      notVisitedParagraph: parseInt(visitAltMatch[2]),
      visitedParagraph: null,
    });
    conditionalChoices.push({
      type: 'optional_action',
      description: visitAltMatch[3] ? 'другой вариант' : null,
      yesParagraph: parseInt(visitAltMatch[3]),
      noParagraph: null,
    });
    conditionalChoices.push({
      type: 'state_check',
      description: 'все дела закончены',
      paragraph: parseInt(visitAltMatch[4]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // VISIT CHECK: «Если вы еще не спускались вниз, можете сделать это — (N)"
  // ═══════════════════════════════════════
  const visitCheckActionRegex = /Если\s+вы\s+ещ[ёе]\s+не\s+([^,—]+?)\s*[,—]?\s*можете\s+[^—]*?[—–-]\s*\((\d+)\)\s*,\s*если\s+вы\s+там\s+не\s+были\s+и\s+не\s+хотите\s+[^—]*?[—–-]\s*\((\d+)\)\s*[.,]?\s*Если\s+уже\s+были\s+там[^—]*?[—–-]\s*\((\d+)\)/i;
  const visitActionMatch = cleaned.match(visitCheckActionRegex);
  if (visitActionMatch) {
    conditionalChoices.push({
      type: 'visit_check',
      description: visitActionMatch[1].trim(),
      notVisitedParagraph: parseInt(visitActionMatch[2]),
      visitedParagraph: parseInt(visitActionMatch[4]),
    });
    conditionalChoices.push({
      type: 'optional_action',
      description: 'не хотите спускаться',
      yesParagraph: null,
      noParagraph: parseInt(visitActionMatch[3]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // SCENARIO CHECKS (keyword-driven, e.g. «Сайпл ждет», «подготовили ловушку», «взорвать фениксоида»)
  // Multiple «Если X — (N)» lines, each is a separate keyword-driven choice
  // ═══════════════════════════════════════
  const scenarioCheckRegex = /Если\s+([^—\n]+?)\s*[—–-]?\s*\((\d+)\)/g;
  const scenarioMatches = [];
  let sm;
  while ((sm = scenarioCheckRegex.exec(cleaned)) !== null) {
    const desc = sm[1].trim();
    // Skip already-handled patterns
    if (/ваш[аие]?\s|у\s+вас\s+записано|у\s+вас\s+есть|параметр|ЛОВКОСТЬ|СТЕЛС|ЗДОРОВЬЕ|АУРА|ХОЛОДНОЕ|ещ[ёе]\s+не|хотите|не\s+хотите|же\s+все/i.test(desc)) continue;
    // Only take scenarios that look like prepared states
    if (/ждет|подготовили|планировали|сделали|построили|установили|подготовка|взорвать|взорвали|ловушку|бассейна|шахты|фениксоида|его\s+взорвать/i.test(desc)) {
      scenarioMatches.push({ description: desc, paragraph: parseInt(sm[2]) });
    }
  }
  if (scenarioMatches.length >= 2) {
    for (const sc of scenarioMatches) {
      conditionalChoices.push({
        type: 'scenario_check',
        description: sc.description,
        paragraph: sc.paragraph,
      });
    }
    // Remove the scenario choices from regular choices
    matched = true;
  }

  // ═══════════════════════════════════════
  // «Если вас заинтересовали X, можете Y — (N). Если решите, что Z — (M)"
  // Optional action with two paragraphs
  // ═══════════════════════════════════════
  const optionalActionAltRegex = /Если\s+вас\s+заинтересовали\s+([^,]+?),\s+можете\s+[^—]*?[—–-]\s*\((\d+)\)\s*\.?\s*Если\s+решите,\s+что\s+[^—]*?[—–-]\s*\((\d+)\)/i;
  const optionalAltMatch = cleaned.match(optionalActionAltRegex);
  if (optionalAltMatch) {
    conditionalChoices.push({
      type: 'optional_action',
      description: optionalAltMatch[1].trim(),
      yesParagraph: parseInt(optionalAltMatch[2]),
      noParagraph: parseInt(optionalAltMatch[3]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // «Если хотите X — (N)» alone (no «если нет»)
  // ═══════════════════════════════════════
  const singleOptionalRegex = /Если\s+хотите\s+([^—]+?)\s*[—–-]\s*\((\d+)\)\s*\./i;
  const singleOptionalMatch = cleaned.match(singleOptionalRegex);
  if (singleOptionalMatch && !optionalMatch) {
    conditionalChoices.push({
      type: 'optional_action',
      description: singleOptionalMatch[1].trim(),
      yesParagraph: parseInt(singleOptionalMatch[2]),
      noParagraph: null,
    });
    // Don't return — there may be more patterns after this
  }

  // ═══════════════════════════════════════
  // «Если у вас записано «X» — (N), если нет, то — (M)"
  // Short form with «то»
  // ═══════════════════════════════════════
  const kwCheckWithToRegex = /Если\s+у\s+вас\s+записано\s+«([^»]+)»\s*[—–-]?\s*\((\d+)\)\s*,\s*если\s+нет\s*,?\s*то\s*[—–-]?\s*\((\d+)\)/i;
  const kwWithToMatch = cleaned.match(kwCheckWithToRegex);
  if (kwWithToMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwWithToMatch[1]),
      hasParagraph: parseInt(kwWithToMatch[2]),
      missingParagraph: parseInt(kwWithToMatch[3]),
    });
    matched = true;
  }

  // ═══════════════════════════════════════
  // «Если у вас записано слово «X», вычеркните его и Y — (N)"
  // Keyword check with removal (single branch)
  // ═══════════════════════════════════════
  const kwCheckRemoveRegex = /Если\s+у\s+вас\s+записано\s+(?:ключевое\s+)?слово\s+«([^»]+)»\s*,\s*вычеркните\s+(?:его|её)\s+[^—]*?[—–-]\s*\((\d+)\)/i;
  const kwRemoveMatch = cleaned.match(kwCheckRemoveRegex);
  if (kwRemoveMatch) {
    conditionalChoices.push({
      type: 'keyword_check',
      keyword: normalizeKeyword(kwRemoveMatch[1]),
      hasParagraph: parseInt(kwRemoveMatch[2]),
      missingParagraph: null,
      description: `Есть «${kwRemoveMatch[1]}» → вычеркнуть`,
    });
    // Add keyword removal if not already added by parseKeywords
    matched = true;
  }

  // ═══════════════════════════════════════
  // REGULAR CHOICES (always parsed)
  // ═══════════════════════════════════════

  // Collect paragraph IDs already covered by conditional choices
  const conditionalParagraphs = new Set();
  for (const cc of conditionalChoices) {
    if (cc.successParagraph != null) conditionalParagraphs.add(cc.successParagraph);
    if (cc.failParagraph != null) conditionalParagraphs.add(cc.failParagraph);
    if (cc.hasParagraph != null) conditionalParagraphs.add(cc.hasParagraph);
    if (cc.missingParagraph != null) conditionalParagraphs.add(cc.missingParagraph);
    if (cc.paragraph != null) conditionalParagraphs.add(cc.paragraph);
    if (cc.yesParagraph != null) conditionalParagraphs.add(cc.yesParagraph);
    if (cc.noParagraph != null) conditionalParagraphs.add(cc.noParagraph);
    if (cc.helpParagraph != null) conditionalParagraphs.add(cc.helpParagraph);
    if (cc.refuseParagraph != null) conditionalParagraphs.add(cc.refuseParagraph);
    if (cc.notVisitedParagraph != null) conditionalParagraphs.add(cc.notVisitedParagraph);
    if (cc.visitedParagraph != null) conditionalParagraphs.add(cc.visitedParagraph);
    if (cc.branches) {
      for (const b of cc.branches) {
        if (b.paragraph != null) conditionalParagraphs.add(b.paragraph);
      }
    }
  }

  // Strategy: find the sentence containing the link number and extract the choice text
  // Pattern: "Воспользуетесь снегоходом — (58) или поедете на ратраке — (114)?"
  // We need: "Воспользуетесь снегоходом" for 58, "поедете на ратраке" for 114

  // Build a map of all link positions in the cleaned text
  const linkPositions = [];
  for (const link of links) {
    // Skip links that are already covered by conditional choices
    if (conditionalParagraphs.has(link.paragraph)) continue;
    // Find position of (N) or just N in the cleaned text
    const patterns = [
      new RegExp(`\\(\\s*${link.text}\\s*\\)`, 'g'),
      new RegExp(`(?<![\\d(])\\b${link.text}\\b(?![\\d)])`, 'g'),
    ];
    for (const pat of patterns) {
      pat.lastIndex = 0;
      const found = pat.exec(cleaned);
      if (found) {
        linkPositions.push({ link, pos: found.index, end: found.index + found[0].length });
        break;
      }
    }
  }

  // Sort by position in text
  linkPositions.sort((a, b) => a.pos - b.pos);

  for (let i = 0; i < linkPositions.length; i++) {
    const lp = linkPositions[i];
    // Text before this link, after previous link (or start of sentence)
    const prevEnd = i > 0 ? linkPositions[i - 1].end : 0;
    let beforeText = cleaned.substring(prevEnd, lp.pos).trim();
    
    // Clean up: remove leading "или", leading dash, leading punctuation
    beforeText = beforeText
      .replace(/^\s*или\s+/i, '')
      .replace(/^\s*[—–-]\s*/, '')
      .replace(/^\s*[,.]\s*/, '')
      .replace(/\s+[—–-]\s*$/, '')
      .trim();
    
    // If the text is too long (> 200 chars), it's probably paragraph text, not a choice description
    // Try to extract just the relevant part: last sentence before the link
    if (beforeText.length > 200) {
      // Find the last sentence boundary
      const lastDot = beforeText.lastIndexOf('.');
      const lastQuestion = beforeText.lastIndexOf('?');
      const lastExcl = beforeText.lastIndexOf('!');
      const lastBoundary = Math.max(lastDot, lastQuestion, lastExcl);
      if (lastBoundary > 0) {
        beforeText = beforeText.substring(lastBoundary + 1).trim();
      }
      // Also try to find "или" as a split point
      if (beforeText.length > 200) {
        const orIdx = beforeText.lastIndexOf(' или ');
        if (orIdx > 0) {
          beforeText = beforeText.substring(orIdx + 5).trim();
        }
      }
    }
    
    // Final cleanup
    beforeText = beforeText
      .replace(/^\s*или\s+/i, '')  // Remove leading "или" again after sentence split
      .replace(/\?\s*$/, '')  // Remove trailing ?
      .trim();
    
    const desc = beforeText || `Перейти к параграфу ${lp.link.text}`;
    
    choices.push({
      paragraph: lp.link.paragraph,
      description: desc,
    });
  }
}

function normalizeKeyword(kw) {
  // Normalize keyword from declined/variant forms to base form
  // Returns lowercase for consistent comparison in the engine
  const lower = kw.toLowerCase().trim();
  const map = {
    'снегоходе': 'снегоход',
    'снегоходом': 'снегоход',
    'ратраке': 'ратрак',
    'ратраком': 'ратрак',
    'ратрака': 'ратрак',
  };
  return map[lower] || lower;
}

function normalizeStat(stat) {
  const raw = stat.trim();
  const upper = raw.toUpperCase();
  const s = upper.replace(/[УЕЁЯ]$/, '');
  
  const map = {
    'ЗДОРОВЬ': 'health',
    'ЗДОРОВЬЕ': 'health',
    'АУРА': 'aura',
    'АУР': 'aura',
    'ЛОВКОСТ': 'agility',
    'ЛОВКОСТЬ': 'agility',
    'ЛОВОКСТЬ': 'agility',
    'ХОЛОДНОЕ ОРУЖИЕ': 'melee',
    'СТЕЛС': 'stealth',
    'АПТЕЧК': 'medkits',
    'АПТЕЧКА': 'medkits',
    'АПТЕЧКИ': 'medkits',
  };
  
  if (map[upper]) return map[upper];
  if (map[s]) return map[s];
  
  // Handle mixed/lower case patterns
  if (/холодн[а-яё]*\s+оружи[яе]/i.test(raw)) return 'melee';
  if (/стелс/i.test(raw)) return 'stealth';
  if (/ловкост[ью]/i.test(raw) || /ловкст[ью]/i.test(raw)) return 'agility';
  if (/здоров[ьяе]/i.test(raw)) return 'health';
  if (/аур[аы]/i.test(raw)) return 'aura';
  if (/аптечк[аиу]/i.test(raw)) return 'medkits';
  
  return raw.toLowerCase();
}

function statName(stat) {
  const names = {
    health: 'Здоровье',
    aura: 'Аура',
    agility: 'Ловкость',
    melee: 'Холодное оружие',
    stealth: 'Стелс',
    medkits: 'Аптечки',
  };
  return names[stat] || stat;
}

function cleanHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Run
const { paragraphs, prologues } = parseGame();

const metadata = {
  title: 'Генезис',
  startingStats: {
    health: 40,
    aura: 5,
    agility: 30,
    melee: 15,
    stealth: 3,
    medkits: 0,
  },
  distributePoints: 5,
  distributeStats: ['agility', 'melee', 'stealth'],
  maxHealth: 40,
  medkitHeal: 4,
  startParagraph: 1,
  prologues,
};

const output = {
  metadata,
  paragraphs,
};

const outPath = path.join(__dirname, '..', 'src', 'data', 'game-data.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`Parsed ${paragraphs.length} paragraphs, ${prologues.length} prologue sections`);
console.log(`Written to ${outPath}`);

// Stats
let totalChoices = 0, totalEffects = 0, totalKeywords = 0, totalConditions = 0;
const condTypes = {};
const effectTypes = {};
for (const p of paragraphs) {
  totalChoices += p.choices.length;
  totalEffects += p.effects.length;
  totalKeywords += p.keywords.length;
  totalConditions += p.conditionalChoices.length;
  for (const e of p.effects) {
    effectTypes[e.type + ':' + e.stat] = (effectTypes[e.type + ':' + e.stat] || 0) + 1;
  }
  for (const c of p.conditionalChoices) {
    condTypes[c.type] = (condTypes[c.type] || 0) + 1;
  }
}
console.log(`Choices: ${totalChoices}, Effects: ${totalEffects}, Keywords: ${totalKeywords}, Conditions: ${totalConditions}`);
console.log(`Effect breakdown:`, effectTypes);
console.log(`Condition breakdown:`, condTypes);

// Show paragraphs with effects to verify
console.log('\n=== Paragraphs with effects ===');
for (const p of paragraphs) {
  if (p.effects.length > 0) {
    console.log(`  P${p.id}: effects=${JSON.stringify(p.effects)}, text snippet="${p.text.join(' ').substring(0, 120)}..."`);
  }
}

// Show paragraphs with keywords to verify
console.log('\n=== Paragraphs with keywords ===');
for (const p of paragraphs) {
  if (p.keywords.length > 0 || p.keywordRemoves.length > 0) {
    console.log(`  P${p.id}: +${JSON.stringify(p.keywords)} -${JSON.stringify(p.keywordRemoves)}`);
  }
}

// Show paragraphs with conditional choices
console.log('\n=== Paragraphs with conditions ===');
for (const p of paragraphs) {
  if (p.conditionalChoices.length > 0) {
    console.log(`  P${p.id}: ${JSON.stringify(p.conditionalChoices)}`);
  }
}