export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

const AFTERNOON_START_HOUR = 12
const EVENING_START_HOUR = 17

export function describeTimeOfDay(hour: number): TimeOfDay {
  if (hour < AFTERNOON_START_HOUR) {
    return 'morning'
  }
  if (hour < EVENING_START_HOUR) {
    return 'afternoon'
  }
  return 'evening'
}

/**
 * Merchant names are a business name, not a person's ("Amaka's Provisions Store") — this
 * pulls a first-name-shaped greeting out of the first word, stripping a trailing possessive
 * "'s", so the dashboard can say "Amaka" instead of the full registered business name.
 */
export function extractGreetingName(merchantName: string): string {
  const firstWord = merchantName.trim().split(/\s+/)[0] ?? merchantName
  return firstWord.replace(/'s$/i, '')
}

const GREETING_LABEL: Record<TimeOfDay, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
}

export function buildGreeting(merchantName: string, now: Date = new Date()): string {
  const label = GREETING_LABEL[describeTimeOfDay(now.getHours())]
  return `${label}, ${extractGreetingName(merchantName)}`
}
