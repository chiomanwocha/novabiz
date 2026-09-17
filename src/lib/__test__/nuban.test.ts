import {
  generateNuban,
  isNubanFormat,
  isValidNubanCheckDigit,
  sanitiseAccountInput,
  suggestBanks,
} from '../nuban'

// Valid vectors: the first two are worked examples from published NUBAN documentation (see
// the source links in nuban.ts's module comment); the third was generated with this same
// verified algorithm to cover a third bank code.
const VALID_VECTORS = [
  { bankCode: '011', accountNumber: '0000014579', bankName: 'First Bank' },
  { bankCode: '058', accountNumber: '0016563228', bankName: 'GTBank' },
  { bankCode: '044', accountNumber: '0102030400', bankName: 'Access Bank' },
]

describe('sanitiseAccountInput', () => {
  it('strips spaces from a pasted number', () => {
    expect(sanitiseAccountInput('0123 456 789')).toBe('0123456789')
  })

  it('strips dashes', () => {
    expect(sanitiseAccountInput('012-345-6789')).toBe('0123456789')
  })

  it('strips non-digit characters entirely', () => {
    expect(sanitiseAccountInput('abc0123456789xyz')).toBe('0123456789')
  })
})

describe('isNubanFormat', () => {
  it('accepts exactly 10 digits', () => {
    expect(isNubanFormat('0016563228')).toBe(true)
  })

  it.each([
    ['too short (9 digits)', '001656322'],
    ['too long (11 digits)', '00165632281'],
    ['contains a letter', '001656322x'],
    ['empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(isNubanFormat(value)).toBe(false)
  })
})

describe('isValidNubanCheckDigit', () => {
  it.each(VALID_VECTORS)(
    'accepts the published/verified check digit for $bankName ($bankCode)',
    ({ bankCode, accountNumber }) => {
      expect(isValidNubanCheckDigit(accountNumber, bankCode)).toBe(true)
    },
  )

  it.each(VALID_VECTORS)(
    'rejects the same account with a wrong check digit for $bankName ($bankCode)',
    ({ bankCode, accountNumber }) => {
      const lastDigit = Number(accountNumber.charAt(9))
      const wrongDigit = (lastDigit + 1) % 10
      const tampered = accountNumber.slice(0, 9) + String(wrongDigit)
      expect(isValidNubanCheckDigit(tampered, bankCode)).toBe(false)
    },
  )

  it('rejects a wrong-length account number instead of throwing', () => {
    expect(isValidNubanCheckDigit('123', '011')).toBe(false)
  })

  it('rejects a malformed bank code instead of throwing', () => {
    expect(isValidNubanCheckDigit('0000014579', '11')).toBe(false)
  })
})

describe('generateNuban', () => {
  it.each(VALID_VECTORS)(
    'reproduces the published/verified account number for $bankName ($bankCode)',
    ({ bankCode, accountNumber }) => {
      expect(generateNuban(bankCode, accountNumber.slice(0, 9))).toBe(accountNumber)
    },
  )

  it('always produces a number that passes its own validity check', () => {
    const generated = generateNuban('033', '123456789')
    expect(isValidNubanCheckDigit(generated, '033')).toBe(true)
  })

  it('rejects a bank code that is not exactly 3 digits', () => {
    expect(() => generateNuban('11', '123456789')).toThrow(RangeError)
  })

  it('rejects a serial that is not exactly 9 digits', () => {
    expect(() => generateNuban('011', '123')).toThrow(RangeError)
  })
})

describe('suggestBanks', () => {
  const banks = [
    { code: '011', name: 'First Bank' },
    { code: '058', name: 'GTBank' },
    { code: '044', name: 'Access Bank' },
  ]

  it('returns only banks whose check digit matches the account number', () => {
    // 0000014579 is only valid for bank 011 among 011/058 — checked against 044
    // separately below, since the same account number can coincidentally validate
    // for more than one bank (the check digit is a single mod-10 value, so a false
    // positive across unrelated banks isn't rare — exactly why this is a typo
    // catcher, not the final authority, per CLAUDE.md 6.3).
    expect(suggestBanks('0000014579', banks.slice(0, 2))).toEqual([
      { code: '011', name: 'First Bank' },
    ])
  })

  it('can return more than one bank when the check digit coincidentally matches both', () => {
    expect(suggestBanks('0000014579', banks)).toEqual(
      expect.arrayContaining([
        { code: '011', name: 'First Bank' },
        { code: '044', name: 'Access Bank' },
      ]),
    )
    expect(suggestBanks('0000014579', banks)).toHaveLength(2)
  })

  it('returns an empty list for a malformed account number', () => {
    expect(suggestBanks('123', banks)).toEqual([])
  })
})
