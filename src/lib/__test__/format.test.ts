import { formatCount } from '../format'

describe('formatCount', () => {
  it('leaves small numbers unchanged', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(50)).toBe('50')
  })

  it('groups thousands with commas', () => {
    expect(formatCount(5000)).toBe('5,000')
    expect(formatCount(1234567)).toBe('1,234,567')
  })
})
