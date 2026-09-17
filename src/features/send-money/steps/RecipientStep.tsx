import { useState } from 'react'

import { useMerchant } from '../../../shared/hooks/useMerchant'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { AccountNumberField } from '../components/AccountNumberField'
import { BankSelect } from '../components/BankSelect'
import { ResolvedNameCard } from '../components/ResolvedNameCard'
import { StatusAnnouncer } from '../components/StatusAnnouncer'
import { useBanks } from '../hooks/useBanks'
import { useNameEnquiry, type NameEnquiryErrorReason } from '../hooks/useNameEnquiry'

export interface ResolvedRecipient {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  nameEnquiryRef: string
}

export interface RecipientDraft {
  bankCode: string | null
  accountNumber: string
}

export interface RecipientStepProps {
  /** Seeds the bank/account fields on mount — how SendMoneyPage restores what was typed before Back. */
  initialDraft?: RecipientDraft
  /** Fires on every bank/account change, so the parent can remember it across a Back navigation. */
  onDraftChange?: (draft: RecipientDraft) => void
  onNext: (recipient: ResolvedRecipient) => void
}

const ERROR_MESSAGES: Record<NameEnquiryErrorReason, string> = {
  not_found: 'Account not found. Please check the details.',
  cannot_receive: "This account can't receive funds.",
  timeout: "We couldn't confirm this account in time.",
  network: "We couldn't confirm this account. Please try again.",
}

/**
 * Next is enabled only once the name resolves and the account isn't the merchant's own —
 * both checked here on the client, and both re-checked by the transfer endpoint itself
 * (CLAUDE.md 6.3/6.4). Name-enquiry itself still runs for the merchant's own account, so
 * the "own account" message only appears once a real name has actually resolved.
 */
export function RecipientStep({ initialDraft, onDraftChange, onNext }: RecipientStepProps) {
  const merchantQuery = useMerchant()
  const banksQuery = useBanks()
  const [bankCode, setBankCode] = useState<string | null>(initialDraft?.bankCode ?? null)
  const [accountNumber, setAccountNumber] = useState(initialDraft?.accountNumber ?? '')

  function updateBankCode(nextBankCode: string | null): void {
    setBankCode(nextBankCode)
    onDraftChange?.({ bankCode: nextBankCode, accountNumber })
  }

  function updateAccountNumber(nextAccountNumber: string): void {
    setAccountNumber(nextAccountNumber)
    onDraftChange?.({ bankCode, accountNumber: nextAccountNumber })
  }

  const enquiry = useNameEnquiry({ bankCode, accountNumber })
  const selectedBank = banksQuery.data?.find((bank) => bank.code === bankCode) ?? null

  const isOwnAccount =
    enquiry.status === 'resolved' &&
    accountNumber === merchantQuery.data?.accountNumber &&
    bankCode === merchantQuery.data.bankCode

  const canContinue = enquiry.status === 'resolved' && !isOwnAccount

  function handleNext(): void {
    if (enquiry.status !== 'resolved' || !bankCode || !selectedBank || isOwnAccount) {
      return
    }
    onNext({
      bankCode,
      bankName: selectedBank.name,
      accountNumber,
      accountName: enquiry.name,
      nameEnquiryRef: enquiry.ref,
    })
  }

  const statusMessage = isOwnAccount
    ? "You can't send money to your own account"
    : enquiry.status === 'checking'
      ? 'Checking account…'
      : enquiry.status === 'error'
        ? ERROR_MESSAGES[enquiry.reason]
        : null

  return (
    <Card className="flex flex-col gap-5">
      <BankSelect
        banks={banksQuery.data ?? []}
        value={bankCode ?? ''}
        onChange={(nextBankCode) => {
          updateBankCode(nextBankCode || null)
        }}
      />
      <AccountNumberField
        value={accountNumber}
        onChange={updateAccountNumber}
        bankCode={bankCode}
        bankName={selectedBank?.name ?? null}
      />
      <StatusAnnouncer
        message={statusMessage}
        isError={enquiry.status === 'error' || isOwnAccount}
      />
      {enquiry.status === 'resolved' && !isOwnAccount && selectedBank && (
        <ResolvedNameCard
          accountName={enquiry.name}
          bankName={selectedBank.name}
          accountNumber={accountNumber}
        />
      )}
      {enquiry.status === 'error' &&
        (enquiry.reason === 'timeout' || enquiry.reason === 'network') && (
          <Button variant="secondary" onClick={enquiry.retry}>
            Retry
          </Button>
        )}
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!canContinue}>
          Next
        </Button>
      </div>
    </Card>
  )
}
