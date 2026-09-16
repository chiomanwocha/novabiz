/** Curated pools for seed data. No faker — kept small and deterministic on purpose. */

export const FIRST_NAMES = [
  'Ade',
  'Chidinma',
  'Emeka',
  'Ngozi',
  'Tunde',
  'Yetunde',
  'Ifeoma',
  'Chinedu',
  'Amaka',
  'Bola',
  'Segun',
  'Funmilayo',
  'Uche',
  'Blessing',
  'Kelechi',
  'Aisha',
  'Ibrahim',
  'Fatima',
  'Musa',
  'Zainab',
  'Obinna',
  'Adaeze',
  'Kunle',
  'Folake',
  'Emmanuel',
  'Grace',
  'Chukwuemeka',
  'Halima',
  'Yusuf',
  'Oluwaseun',
  'Temitope',
  'Chiamaka',
  'Babajide',
  'Damilola',
  'Nkechi',
  'Abdulrahman',
  'Rasheedat',
  'Ikechukwu',
] as const

export const LAST_NAMES = [
  'Okafor',
  'Adeyemi',
  'Balogun',
  'Nwosu',
  'Okoro',
  'Eze',
  'Abubakar',
  'Mohammed',
  'Bello',
  'Adegoke',
  'Chukwu',
  'Okonkwo',
  'Ogundipe',
  'Yakubu',
  'Suleiman',
  'Ojo',
  'Afolabi',
  'Nnamdi',
  'Uzoma',
  'Danjuma',
  'Ibekwe',
  'Oyelaran',
  'Mustapha',
  'Salihu',
  'Nwachukwu',
  'Adisa',
  'Akande',
  'Ekpo',
  'Gambo',
] as const

/** Narrations a market trader / provision-store / IG vendor / spare-parts dealer would actually see. */
export const NARRATIONS = [
  'Payment for goods',
  'Stock supply payment',
  'POS settlement',
  'Refund for order',
  'Payment received - thank you',
  'Rice supply - 2 bags',
  'Weekly stock payment',
  'School fees contribution',
  'Data subscription payment',
  'Spare parts - brake pads',
  'Fabric supply payment',
  'Payment for provisions',
  'Generator fuel refund',
  'Transport fare refund',
  'Payment for phone case',
  'Wholesale payment',
  'Balance payment',
  'Deposit for order',
  'Payment for delivery',
  'Container clearance fee',
  'Payment for shoes',
  'Bag of rice payment',
  'Provision store restock',
  'Payment - Instagram order',
  'Cement supply payment',
  'Payment for engine oil',
  'Vendor payment',
  'Payment for wristwatch',
] as const

/**
 * Hostile strings the seed data must include verbatim, to prove descriptions render
 * as text only (CLAUDE.md 6.2 / hard constraint in section 2 — never
 * `dangerouslySetInnerHTML`). Exactly these five, guaranteed present in the seed.
 */
export const HOSTILE_DESCRIPTIONS = [
  '<img src=x onerror=alert(1)>',
  "<script>alert('x')</script>",
  '"><b>bold</b>',
  (
    'This is an unusually long transaction narration that a merchant might paste from an ' +
    'invoice system, used here to test that long descriptions do not break the transaction ' +
    'row layout at any screen width, from 360px phones up to a 1440px desktop panel view. '
  )
    .repeat(3)
    .slice(0, 300),
  '🎉🎉🎉 Payment received!!! 💰💰💰 Thank you 🙏🏽🙏🏽 God bless your business 🙌🏾',
] as const
