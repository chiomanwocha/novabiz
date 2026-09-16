export const sendMoneyCopy = {
  pageTitle: 'Send Money',
  stepTitles: {
    recipient: 'Who are you sending to?',
    amount: 'How much?',
    review: 'Review your transfer',
    confirm: 'Confirm',
  },
  stepLabels: {
    recipient: 'Recipient',
    amount: 'Amount',
    review: 'Review',
    confirm: 'Confirm',
  },
  // Placeholders until RecipientStep (CP-16), AmountStep (CP-17), and ReviewStep/ConfirmStep
  // (CP-18) replace them with real form content.
  stepPlaceholders: {
    recipient: 'Recipient details coming in CP-16.',
    amount: 'Amount entry coming in CP-17.',
    review: 'Review coming in CP-18.',
    confirm: 'Confirm & send coming in CP-18.',
  },
} as const
