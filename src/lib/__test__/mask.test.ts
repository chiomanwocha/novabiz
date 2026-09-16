import { maskAccountNumber } from '../mask'

describe('maskAccountNumber', () => {
  it('masks all but the last 4 digits of a 10-digit account number', () => {
    expect(maskAccountNumber('0016563228')).toBe('******3228')
  })

  it('leaves a 4-digit string fully visible', () => {
    expect(maskAccountNumber('4821')).toBe('4821')
  })

  it('does not mask below zero asterisks for a shorter string', () => {
    expect(maskAccountNumber('12')).toBe('12')
  })

  it('returns an empty string unchanged', () => {
    expect(maskAccountNumber('')).toBe('')
  })
})
