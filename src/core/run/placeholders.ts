/** The placeholders a value can hold, each replaced when a run starts. */
export const PLACEHOLDERS = ['timestamp', 'date', 'time', 'random'] as const

export type Placeholder = (typeof PLACEHOLDERS)[number]

/** What each placeholder becomes in one run. */
export type PlaceholderValues = Record<Placeholder, string>

const PLACEHOLDER = /\{(timestamp|date|time|random)\}/g

const RANDOM_LENGTH = 8
const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * One run's placeholder values, all from the same instant `now` (ms since the
 * epoch), in the browser's local time zone: `{date}` as `MM/DD/YYYY`,
 * `{time}` as 24-hour `HH:MM`.
 */
export function placeholderValues(now: number, random: string): PlaceholderValues {
  const at = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    timestamp: String(now),
    date: `${pad(at.getMonth() + 1)}/${pad(at.getDate())}/${at.getFullYear()}`,
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
    random,
  }
}

/** 8 characters of lowercase letters and digits, from a cryptographic source. */
export function randomToken(): string {
  let token = ''
  // 252 is the largest multiple of 36 below 256: bytes past it are dropped so every character is equally likely.
  while (token.length < RANDOM_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(RANDOM_LENGTH * 2))) {
      if (byte < 252 && token.length < RANDOM_LENGTH) {
        token += RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length]
      }
    }
  }
  return token
}

/** `value` with every placeholder replaced; anything else, braces included, is kept as typed. */
export function resolvePlaceholders(value: string, values: PlaceholderValues): string {
  return value.replace(PLACEHOLDER, (_, name: Placeholder) => values[name])
}
