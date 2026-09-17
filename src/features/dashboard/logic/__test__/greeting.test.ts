import { buildGreeting, describeTimeOfDay, extractGreetingName } from '../greeting'

describe('describeTimeOfDay', () => {
  it('is morning before noon', () => {
    expect(describeTimeOfDay(9)).toBe('morning')
  })

  it('is afternoon from noon up to 5pm', () => {
    expect(describeTimeOfDay(12)).toBe('afternoon')
    expect(describeTimeOfDay(16)).toBe('afternoon')
  })

  it('is evening from 5pm onward', () => {
    expect(describeTimeOfDay(17)).toBe('evening')
    expect(describeTimeOfDay(23)).toBe('evening')
  })
})

describe('extractGreetingName', () => {
  it('takes the first word of a business name', () => {
    expect(extractGreetingName('Ngozi Ventures')).toBe('Ngozi')
  })

  it('strips a trailing possessive from the first word', () => {
    expect(extractGreetingName("Amaka's Provisions Store")).toBe('Amaka')
  })

  it('handles a single-word name', () => {
    expect(extractGreetingName('Chidinma')).toBe('Chidinma')
  })
})

describe('buildGreeting', () => {
  it('combines the time of day and the greeting name', () => {
    expect(buildGreeting("Amaka's Provisions Store", new Date(2026, 0, 1, 8))).toBe(
      'Good morning, Amaka',
    )
    expect(buildGreeting("Amaka's Provisions Store", new Date(2026, 0, 1, 15))).toBe(
      'Good afternoon, Amaka',
    )
    expect(buildGreeting("Amaka's Provisions Store", new Date(2026, 0, 1, 20))).toBe(
      'Good evening, Amaka',
    )
  })
})
