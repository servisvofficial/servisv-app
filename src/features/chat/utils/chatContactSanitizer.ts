/**
 * Sanitiza texto de chat: no permite números (ni en un mensaje ni repartidos en varios).
 * También oculta correos y medios de contacto. Sustituye coincidencias por ****.
 */

const REPLACEMENT = "****";

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/** Ventana para detectar números repartidos en mensajes consecutivos */
export const CHAT_NUMERIC_HISTORY_MAX = 12;
export const CHAT_NUMERIC_HISTORY_TTL_MS = 30 * 60 * 1000;

/** Separadores habituales al escribir un teléfono de forma ofuscada */
const PHONE_SEPARATORS = /[\s.\-_/|,()+*#:;\\[\]{}'"`~]+/g;

const DIGIT_WORDS =
  "cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|zero|one|two|three|four|five|six|seven|eight|nine|oh";

const DIGIT_WORD_RE = new RegExp(`\\b(?:${DIGIT_WORDS})\\b`, "gi");

/** Cualquier secuencia de dígitos (1 o más), incl. unicode */
const ANY_DIGIT_RUN = /[\d\uFF10-\uFF19\u0660-\u0669]+/g;

/** Regex y reemplazo para emails (estándar y ofuscados) */
const EMAIL_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\b[A-Za-z0-9._%+-]+\s*(?:@|at|arroba|\[at\]|\(at\))\s*[A-Za-z0-9.-]+\s*(?:\.|dot|punto|\[dot\]|\(dot\))\s*(?:com|net|org|es|sv|io|gmail|hotmail|yahoo|outlook)\b/gi,
  /\b[A-Za-z0-9._%+-]+\s*\.(?:com|net|org|es)\b/gi,
];

/** Patrones de teléfono / contacto con contexto (antes del barrido de todos los dígitos) */
const PHONE_PATTERNS: RegExp[] = [
  /(?:tel|telefono|teléfono|cel|celular|numero|número|num|whatsapp|wsp|ws|wa|contacto|llamar|llamame|llámame)\s*[:=]?\s*[\d\s.\-_/|,()+*#:;\\[\]{}]{1,40}/gi,
  /\bmi\s+(?:numero|número|num|tel|telefono|teléfono|cel|whatsapp|wa)\s+(?:es\s+)?[\d\s.\-_/|,()+*#:;\\[\]{}]{1,40}/gi,
  /\b(?:escribeme|escríbeme|escribe|llamame|llámame|llama)\s+al\s+[\d\s.\-_/|,()+*#:;\\[\]{}]{1,40}/gi,
  /\b(?:cinco\s*(?:y\s*)?cero\s*(?:y\s*)?tres|five\s*(?:and\s*)?zero\s*(?:and\s*)?three)(?:\s*(?:y\s*)?[\s,.\-_/|]+(?:\d|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|zero|one|two|three|four|five|six|seven|eight|nine)){1,12}/gi,
  new RegExp(
    `\\b(?:(?:${DIGIT_WORDS})(?:\\s*(?:y\\s*)?)?[\\s,.\-_/|]+){1,14}(?:${DIGIT_WORDS})\\b`,
    "gi"
  ),
  new RegExp(
    `\\b(?:(?:\\d|${DIGIT_WORDS})(?:\\s*(?:y\\s*)?)?[\\s,.\-_/|]+){1,14}(?:\\d|${DIGIT_WORDS})\\b`,
    "gi"
  ),
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
];

const LOOSE_PHONE_CHUNK =
  /[\d\uFF10-\uFF19\u0660-\u0669\s.\-_/|,()+*#:;\\[\]{}'"`~oOlIiIzZsbBgq]/gi;

const WORD_TO_DIGIT: Record<string, string> = {
  cero: "0",
  uno: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  oh: "0",
};

const LEET_TO_DIGIT: Record<string, string> = {
  o: "0",
  O: "0",
  l: "1",
  I: "1",
  i: "1",
  z: "2",
  Z: "2",
  s: "5",
  S: "5",
  b: "8",
  B: "8",
  g: "9",
  G: "9",
  q: "9",
  Q: "9",
};

export interface SanitizeChatOptions {
  /** Mensajes de texto recientes del mismo remitente en el chat (texto original, sin sanitizar) */
  recentSenderTexts?: string[];
}

export interface SanitizeResult {
  sanitized: string;
  hadContactInfo: boolean;
}

function normalizeUnicodeDigits(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined) return char;
  if (code >= 0xff10 && code <= 0xff19) return String(code - 0xff10);
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  return char;
}

/** Extrae todos los dígitos y palabras-numero de un texto (para historial y mensajes cruzados) */
export function extractNumericPayload(text: string): string {
  if (!text) return "";
  let payload = "";
  for (const ch of text) {
    const n = normalizeUnicodeDigits(ch);
    if (/\d/.test(n)) payload += n;
  }
  const wordRe = new RegExp(`\\b(?:${DIGIT_WORDS})\\b`, "gi");
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(text)) !== null) {
    payload += WORD_TO_DIGIT[match[0].toLowerCase()] ?? "";
  }
  return payload;
}

export function messageHasNumericContent(text: string): boolean {
  return extractNumericPayload(text).length > 0;
}

function expandChunkToDigits(chunk: string): string {
  let digits = "";
  const tokens = chunk.split(PHONE_SEPARATORS).filter(Boolean);

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (WORD_TO_DIGIT[lower] !== undefined) {
      digits += WORD_TO_DIGIT[lower];
      continue;
    }
    if (/^\d+$/.test(token)) {
      digits += token;
      continue;
    }
    if (/^[oOlIiIzZsbBgqQ]+$/.test(token) && token.length <= 4) {
      for (const ch of token) {
        digits += LEET_TO_DIGIT[ch] ?? "";
      }
    }
  }

  if (digits.length > 0) return digits;

  let fromChars = "";
  for (const ch of chunk) {
    const n = normalizeUnicodeDigits(ch);
    if (/\d/.test(n)) fromChars += n;
    else if (PHONE_SEPARATORS.test(ch) || ch === " ") continue;
    else {
      const w = WORD_TO_DIGIT[ch.toLowerCase()];
      if (w) fromChars += w;
      else if (LEET_TO_DIGIT[ch]) fromChars += LEET_TO_DIGIT[ch];
    }
  }
  return fromChars;
}

function checkCrossMessageBlock(
  text: string,
  recentSenderTexts?: string[]
): SanitizeResult | null {
  if (!recentSenderTexts?.length) return null;

  const recentPayload = extractNumericPayload(recentSenderTexts.join(" "));
  const currentPayload = extractNumericPayload(text);
  const combinedPayload = extractNumericPayload(
    [...recentSenderTexts, text].join(" ")
  );

  if (combinedPayload.length >= MIN_PHONE_DIGITS) {
    return { sanitized: REPLACEMENT, hadContactInfo: true };
  }

  if (recentPayload.length > 0 && currentPayload.length > 0) {
    return { sanitized: REPLACEMENT, hadContactInfo: true };
  }

  return null;
}

/** Censura cualquier dígito, incluso uno suelto: 3, 94, 394 */
function censorAllDigits(text: string): { result: string; found: boolean } {
  const before = text;
  const result = text.replace(ANY_DIGIT_RUN, REPLACEMENT);
  return { result, found: result !== before };
}

/** Censura palabras-numero sueltas: "uno", "siete" */
function censorDigitWords(text: string): { result: string; found: boolean } {
  const before = text;
  const result = text.replace(DIGIT_WORD_RE, REPLACEMENT);
  return { result, found: result !== before };
}

function censorLooseDigitSequences(text: string): { result: string; found: boolean } {
  let result = text;
  let found = false;
  const chunkRe = new RegExp(`(?:${LOOSE_PHONE_CHUNK.source}){1,120}`, "gi");

  let match: RegExpExecArray | null;
  const matches: { start: number; end: number }[] = [];

  while ((match = chunkRe.exec(text)) !== null) {
    const chunk = match[0];
    if (!/[\d\uFF10-\uFF19\u0660-\u0669]/.test(chunk)) continue;
    const digits = expandChunkToDigits(chunk);
    if (digits.length >= 1 && digits.length <= MAX_PHONE_DIGITS) {
      matches.push({ start: match.index, end: match.index + chunk.length });
    }
  }

  if (matches.length === 0) return { result, found };

  matches.sort((a, b) => b.start - a.start);
  for (const { start, end } of matches) {
    const slice = result.slice(start, end);
    if (slice === REPLACEMENT) continue;
    result = result.slice(0, start) + REPLACEMENT + result.slice(end);
    found = true;
  }

  return { result, found };
}

function applyPatterns(text: string, patterns: RegExp[]): { result: string; found: boolean } {
  let result = text;
  let found = false;
  for (const re of patterns) {
    const before = result;
    result = result.replace(re, REPLACEMENT);
    if (result !== before) found = true;
  }
  return { result, found };
}

function isMostlyNumericMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^[\d\s.\-_/|,()+*#:;\\[\]{}'"`~+]+$/.test(trimmed);
}

/**
 * Sanitiza un mensaje de chat. No permite ningún número.
 * Con `recentSenderTexts`, bloquea trozos repartidos en varios mensajes (ej. "394" + "432").
 */
export function sanitizeChatContactInfo(
  text: string,
  options?: SanitizeChatOptions
): SanitizeResult {
  if (!text || typeof text !== "string") {
    return { sanitized: text || "", hadContactInfo: false };
  }

  const crossBlock = checkCrossMessageBlock(text, options?.recentSenderTexts);
  if (crossBlock) return crossBlock;

  if (isMostlyNumericMessage(text)) {
    return { sanitized: REPLACEMENT, hadContactInfo: true };
  }

  let sanitized = text;
  let hadContactInfo = false;

  const steps = [
    () => applyPatterns(sanitized, EMAIL_PATTERNS),
    () => applyPatterns(sanitized, PHONE_PATTERNS),
    () => applyPatterns(sanitized, CONTACT_URL_PATTERNS),
    () => applyPatterns(sanitized, CONTACT_PHRASE_PATTERNS),
    () => censorAllDigits(sanitized),
    () => censorDigitWords(sanitized),
    () => censorLooseDigitSequences(sanitized),
    () => censorAllDigits(sanitized),
    () => censorDigitWords(sanitized),
  ];

  for (const step of steps) {
    const { result, found } = step();
    sanitized = result;
    if (found) hadContactInfo = true;
  }

  if (messageHasNumericContent(sanitized)) {
    sanitized = REPLACEMENT;
    hadContactInfo = true;
  }

  return { sanitized, hadContactInfo };
}

export function numericHistoryKey(chatId: string, senderId: string): string {
  return `${chatId}:${senderId}`;
}
