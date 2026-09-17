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
  review: {
    recipientHeading: 'Sending to',
    amountHeading: 'Amount',
    narrationLabel: 'For',
    confirmButton: 'Continue to confirm',
  },
  confirm: {
    sendButton: 'Send money',
    sendingMessage: 'Sending…',
    successMessage: 'Transfer sent',
    genericFailureMessage:
      "We couldn't confirm your transfer. Please check your balance and try again.",
    unconfirmedMessage: "We couldn't confirm what happened yet — checking…",
    retryButton: 'Try again',
  },
  amountField: {
    label: 'Amount',
    hint: 'Enter an amount in Naira, e.g. 1,000.50',
    narrationLabel: "What's this for? (optional)",
    narrationHint: 'Up to 100 characters',
  },
  amountErrors: {
    invalid: 'Enter an amount greater than zero',
    overBalance: 'This is more than your available balance',
    overSingleLimit: 'This is more than you can send in one transfer',
    overDailyLimit: "This is more than what's left of today's sending limit",
    narrationTooLong: 'Keep this to 100 characters or fewer',
  },
  // Shown beside the step card on wide screens only (StepContextPanel) — context that's true
  // of the finished design, not filler. Recipient's points describe what's actually live
  // today (CP-16); the other three describe what the later checkpoints will build, since the
  // steps themselves are still placeholders.
  stepContext: {
    recipient: {
      heading: 'Getting the recipient right',
      points: [
        "We check the account number's format before anything else, so a typo gets caught before it ever reaches the bank.",
        'The name that comes back is the one you should check — not the one you typed. It resolves fresh every time you change the bank or account number.',
        "You can't send to your own NovaBiz account by mistake — we block it once the name resolves.",
      ],
    },
    amount: {
      heading: 'Staying inside your limits',
      points: [
        'Your available balance, single-transfer limit, and remaining daily limit all come from your account — never hard-coded.',
        'Settlement over NIBSS is instant, so the amount you send is what lands, in kobo, with no rounding.',
      ],
    },
    review: {
      heading: 'One tap, one transfer',
      points: [
        'Every transfer gets a unique key the moment you reach this step, sent with the request.',
        'If you go back and change the recipient or amount, a new key is created — editing never reuses an old one.',
        'Double-tapping Send can never send twice: a repeated key returns the same result instead of debiting again.',
      ],
    },
    confirm: {
      heading: 'If your connection drops',
      points: [
        "We show your new balance right away, but it's provisional until the server confirms it.",
        'If the request times out, we check what actually happened before deciding whether to undo the change — never a guess.',
        'A failed transfer is always rolled back and explained; a slow-but-successful one never gets reversed by mistake.',
      ],
    },
  },
} as const
