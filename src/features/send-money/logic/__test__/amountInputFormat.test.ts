import {
  countMeaningfulCharsBefore,
  formatAmountInputValue,
  positionAfterMeaningfulChars,
} from '../amountInputFormat'

describe('formatAmountInputValue', () => {
  it('groups a whole-number amount with thousands commas as it grows', () => {
    expect(formatAmountInputValue('50000')).toBe('50,000')
    expect(formatAmountInputValue('1000050')).toBe('1,000,050')
  })

  it('strips letters and symbols, keeping only digits and a decimal point', () => {
    expect(formatAmountInputValue('50a0b0!0')).toBe('50,000')
  })

  it('keeps a decimal point and groups only the integer part', () => {
    expect(formatAmountInputValue('1000.5')).toBe('1,000.5')
  })

  it('caps the decimal part at 2 digits, matching what parseNairaToKobo actually supports', () => {
    expect(formatAmountInputValue('1000.999')).toBe('1,000.99')
  })

  it('collapses a second decimal point into more decimal digits instead of keeping it', () => {
    expect(formatAmountInputValue('1.2.3')).toBe('1.23')
  })

  it('returns an empty string for empty input', () => {
    expect(formatAmountInputValue('')).toBe('')
  })

  it('leaves a small amount ungrouped (fewer than 4 integer digits)', () => {
    expect(formatAmountInputValue('500')).toBe('500')
  })
})

describe('countMeaningfulCharsBefore / positionAfterMeaningfulChars', () => {
  it('round-trips a cursor position when typing in the middle shifts a later comma', () => {
    // Starting display "12,345", cursor right after "12" (position 2). Typing "9" there makes
    // the raw (pre-reformat) input value "129,345" with the cursor now at position 3. After
    // reformatting (still "129,345" — same grouping), the cursor should land right after the
    // "9" the user just typed, not get shoved to the end by the comma.
    const rawAfterKeystroke = '129,345'
    const cursorAfterKeystroke = 3
    const meaningfulCount = countMeaningfulCharsBefore(rawAfterKeystroke, cursorAfterKeystroke)

    const reformatted = formatAmountInputValue(rawAfterKeystroke)
    expect(reformatted).toBe('129,345')
    expect(positionAfterMeaningfulChars(reformatted, meaningfulCount)).toBe(3)
  })

  it('ignores commas already in the string when counting meaningful characters', () => {
    expect(countMeaningfulCharsBefore('1,000', 5)).toBe(4)
  })

  it('places the cursor at the end when the count meets or exceeds the value length', () => {
    expect(positionAfterMeaningfulChars('1,000', 10)).toBe(5)
  })

  it('places the cursor at the start for a zero or negative count', () => {
    expect(positionAfterMeaningfulChars('1,000', 0)).toBe(0)
  })
})
