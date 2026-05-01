/**
 * Text processing utilities for visual text enhancements.
 * 9.2 — Quote/dialogue detection
 * 9.3 — Keyword highlighting
 * 9.1 — Drop cap detection
 */

import type { KeywordRecord } from '../engine/types';

/**
 * Detect if a line of text is a character quote / dialogue.
 * Matches:
 *   - «...» (ёлочки)
 *   - — ... (тире с пробелом — диалог)
 *   - Lines that start with « or —
 */
export function isQuoteLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  // Ёлочки: starts with « or contains «...» pattern
  if (trimmed.startsWith('«') || trimmed.startsWith('—') || trimmed.startsWith('–')) return true;
  // Lines that are mostly a quote: contain «...» and start with it
  if (/^["«]/.test(trimmed)) return true;
  return false;
}

/**
 * Split text into parts — quoted fragments and normal fragments.
 * Used for highlighting quotes with border-left styling.
 */
export interface TextFragment {
  text: string;
  isQuote: boolean;
}

export function splitQuoteFragments(line: string): TextFragment[] {
  // If the whole line is a quote line, return it as a single quote fragment
  if (isQuoteLine(line)) {
    return [{ text: line, isQuote: true }];
  }

  // Otherwise, try to extract «...» fragments from within the line
  const fragments: TextFragment[] = [];
  const quoteRegex = /«[^»]+»/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(line)) !== null) {
    // Add text before the quote
    if (match.index > lastIndex) {
      fragments.push({ text: line.slice(lastIndex, match.index), isQuote: false });
    }
    // Add the quoted text
    fragments.push({ text: match[0], isQuote: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < line.length) {
    fragments.push({ text: line.slice(lastIndex), isQuote: false });
  }

  return fragments.length > 0 ? fragments : [{ text: line, isQuote: false }];
}

/**
 * Highlight keywords in text that the player already possesses.
 * Returns React-safe spans with markers for keyword positions.
 */
export interface TextPart {
  text: string;
  isKeyword: boolean;
}

export function highlightKeywordsInText(text: string, playerKeywords: KeywordRecord[]): TextPart[] {
  if (playerKeywords.length === 0) return [{ text, isKeyword: false }];

  // Build a regex that matches any keyword (sorted by length desc so longer matches win)
  const kwStrings = playerKeywords
    .filter(k => k.count > 0)
    .map(k => k.word)
    .sort((a, b) => b.length - a.length); // longest first

  if (kwStrings.length === 0) return [{ text, isKeyword: false }];

  // Escape regex special characters
  const escaped = kwStrings.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isKeyword: false });
    }
    // The keyword match
    parts.push({ text: match[0], isKeyword: true });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isKeyword: false });
  }

  return parts.length > 0 ? parts : [{ text, isKeyword: false }];
}

/**
 * Combined processor: takes a paragraph text array and returns processed lines
 * with all visual enhancements applied (quotes + keywords + drop cap marker).
 */
export interface ProcessedLine {
  /** The line fragments (quote detection + keyword highlighting) */
  fragments: TextPart[];
  /** Whether this line is a quote line (for border-left styling) */
  isQuote: boolean;
  /** Whether this line should have drop cap (first line of first paragraph) */
  hasDropCap: boolean;
}

export function processParagraphText(
  textLines: string[],
  playerKeywords: KeywordRecord[],
  isFirstParagraph: boolean
): ProcessedLine[] {
  return textLines.map((line, i) => {
    const isQuote = isQuoteLine(line);
    const hasDropCap = isFirstParagraph && i === 0 && line.trim().length > 0;
    const fragments = highlightKeywordsInText(line, playerKeywords);

    return { fragments, isQuote, hasDropCap };
  });
}