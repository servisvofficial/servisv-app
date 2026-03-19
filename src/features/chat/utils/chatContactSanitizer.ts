/**
 * Sanitiza texto de chat para ocultar números de teléfono, correos y medios de contacto.
 * Sustituye coincidencias por **** para mantener las conversaciones dentro de la plataforma.
 */

const REPLACEMENT = "****";

const EMAIL_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\b[A-Za-z0-9._%+-]+\s*(?:@|at|arroba|\[at\]|\(at\))\s*[A-Za-z0-9.-]+\s*(?:\.|dot|punto|\[dot\]|\(dot\))\s*(?:com|net|org|es|sv|io|gmail|hotmail|yahoo|outlook)\b/gi,
  /\b[A-Za-z0-9._%+-]+\s*\.(?:com|net|org|es)\b/gi,
];

const PHONE_PATTERNS: RegExp[] = [
  /\+\d{1,4}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}\b/g,
  /\b(?:503|502|504|505|506|507)\s*[-.\s]?\d{4}\s*[-.\s]?\d{4}\b/g,
  /\b\d{4}\s*[-.\s]\s*\d{4}\b/g,
  /\b[67]\d{3}\s*[-.\s]?\d{4}\b/g,
  /\b\d{7,12}\b/g,
  /(?:tel|telefono|teléfono|cel|celular|numero|número|num|whatsapp|wa|contacto)\s*[:=]?\s*[\d\s.\-+()]{7,20}/gi,
];

const CONTACT_URL_PATTERNS: RegExp[] = [
  /\b(?:https?:\/\/)?(?:wa\.me|whatsapp\.com|api\.whatsapp\.com)\/[^\s]*/gi,
  /\b(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.dog)\/[^\s]*/gi,
  /\b(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s]*/gi,
  /\b(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s]*/gi,
  /\b(?:instagram|insta|fb|face|facebook|whatsapp|telegram|wa)\s*[.:]\s*[^\s]+/gi,
];

const CONTACT_PHRASE_PATTERNS: RegExp[] = [
  /\b(?:contactame|contáctame|contacto\s*directo|escribeme|escríbeme|escribe\s*al|llamame|llámame|llama\s*al)\b/gi,
  /\bmi\s*(?:numero|número|num|correo|email|whatsapp|wa|telegram|insta|instagram|face|fb)\s*(?:es|:)?/gi,
  /\b(?:te\s*paso|te\s*doy|agregame|agrégame|agregueme)\s*(?:mi\s*)?(?:numero|número|whatsapp|wa|telegram)?/gi,
  /\b(?:por\s*fuera|fuera\s*de\s*la\s*app|fuera\s*de\s*la\s*plataforma|operamos\s*por\s*fuera)\b/gi,
  /\b(?:busca(?:me)?|búscame)\s*(?:en\s*)?(?:instagram|insta|facebook|whatsapp|telegram)/gi,
  /\b\d{3}\s*\d{2}\s*\d{2}\s*\d{2}\b/g,
];

function applyPatterns(
  text: string,
  patterns: RegExp[]
): { result: string; found: boolean } {
  let result = text;
  let found = false;
  for (const re of patterns) {
    const before = result;
    result = result.replace(re, REPLACEMENT);
    if (result !== before) found = true;
  }
  return { result, found };
}

export interface SanitizeResult {
  sanitized: string;
  hadContactInfo: boolean;
}

export function sanitizeChatContactInfo(text: string): SanitizeResult {
  if (!text || typeof text !== "string") {
    return { sanitized: text || "", hadContactInfo: false };
  }
  let sanitized = text;
  let hadContactInfo = false;

  const steps = [
    () => applyPatterns(sanitized, EMAIL_PATTERNS),
    () => applyPatterns(sanitized, PHONE_PATTERNS),
    () => applyPatterns(sanitized, CONTACT_URL_PATTERNS),
    () => applyPatterns(sanitized, CONTACT_PHRASE_PATTERNS),
  ];

  for (const step of steps) {
    const { result, found } = step();
    sanitized = result;
    if (found) hadContactInfo = true;
  }

  return { sanitized, hadContactInfo };
}
