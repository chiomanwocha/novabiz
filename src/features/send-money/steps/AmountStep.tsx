import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ChangeEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { formatKobo, parseNairaToKobo, toKobo, type Kobo } from '../../../lib/money'
import { useMerchant } from '../../../shared/hooks/useMerchant'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { sendMoneyCopy } from '../copy'
import {
  countMeaningfulCharsBefore,
  formatAmountInputValue,
  positionAfterMeaningfulChars,
} from '../logic/amountInputFormat'
import { createAmountSchema, type AmountFormValues, type AmountLimits } from '../logic/schemas'

export interface ResolvedAmount {
  amountKobo: Kobo
  narration: string
}

export type AmountDraft = AmountFormValues

export interface AmountStepProps {
  /** Seeds the amount/narration fields on mount — how SendMoneyPage restores what was typed before Back. */
  initialDraft?: AmountDraft
  /** Fires on every field change, so the parent can remember it across a Back navigation. */
  onDraftChange?: (draft: AmountDraft) => void
  onBack: () => void
  onNext: (amount: ResolvedAmount) => void
}

const EMPTY_DRAFT: AmountDraft = { amountNaira: '', narration: '' }
const ZERO_LIMITS: AmountLimits = {
  balanceKobo: toKobo(0),
  singleTransferLimitKobo: toKobo(0),
  remainingDailyLimitKobo: toKobo(0),
}

/**
 * The error *text* validates on blur, not on every keystroke, per CLAUDE.md 6.4 (fewer
 * re-renders on the low-end phones these merchants use). Whether Next is *enabled* still
 * reacts live to typing as well as blur — see `isFormValid` below for why that's judged
 * separately from the error text. The limits a given amount is checked against come straight
 * from the merchant record — never hard-coded — so the schema is rebuilt each render from
 * whatever `useMerchant` currently has. Hooks are still called unconditionally on every render
 * (the merchant loading/error states only change what JSX comes back, not which hooks run),
 * keeping this one component instead of splitting into a loader plus an inner form.
 */
export function AmountStep({
  initialDraft = EMPTY_DRAFT,
  onDraftChange,
  onBack,
  onNext,
}: AmountStepProps) {
  const merchantQuery = useMerchant()
  const merchant = merchantQuery.data

  const limits: AmountLimits = merchant
    ? {
        balanceKobo: merchant.balanceKobo,
        singleTransferLimitKobo: merchant.singleTransferLimitKobo,
        remainingDailyLimitKobo: toKobo(merchant.dailyLimitKobo - merchant.usedTodayKobo),
      }
    : ZERO_LIMITS

  const amountSchema = createAmountSchema(limits)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: initialDraft,
  })

  const watchedValues = useWatch({ control })
  useEffect(() => {
    onDraftChange?.({
      amountNaira: watchedValues.amountNaira ?? '',
      narration: watchedValues.narration ?? '',
    })
  }, [watchedValues.amountNaira, watchedValues.narration, onDraftChange])

  // The red error text stays blur-gated (mode/reValidateMode: 'onBlur', above) — re-parsing on
  // every keystroke just for that would mean the message flickers mid-type. But the Next
  // button's disabled state is judged separately, live, straight off the schema (the single
  // source of truth `errors` also comes from) — CLAUDE.md 6.4 says "validate on blur and on
  // Next", but a Next button a merchant can still press while it's obviously invalid, only to
  // be told so after tapping it, is worse than one that's visibly disabled until it's ready.
  const isFormValid = amountSchema.safeParse({
    amountNaira: watchedValues.amountNaira ?? '',
    narration: watchedValues.narration ?? '',
  }).success

  // register('amountNaira') still supplies name/onBlur/ref (onBlur is what actually drives the
  // 'onBlur' mode above); value/onChange are overridden below so the field can reformat itself
  // as the user types (CLAUDE.md-standard controlled-field-on-top-of-register combination).
  function handleAmountChange(event: ChangeEvent<HTMLInputElement>): void {
    const input = event.target
    const cursorPosition = input.selectionStart ?? input.value.length
    const meaningfulCharsBeforeCursor = countMeaningfulCharsBefore(input.value, cursorPosition)

    const formatted = formatAmountInputValue(input.value)
    input.value = formatted
    const newCursorPosition = positionAfterMeaningfulChars(formatted, meaningfulCharsBeforeCursor)
    input.setSelectionRange(newCursorPosition, newCursorPosition)

    setValue('amountNaira', formatted, { shouldDirty: true })
  }

  if (merchantQuery.isPending) {
    return (
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    )
  }

  if (merchantQuery.isError) {
    return (
      <Card>
        <ErrorState
          message="We couldn't load your balance and limits."
          onRetry={() => {
            void merchantQuery.refetch()
          }}
        />
      </Card>
    )
  }

  function onValid(values: AmountFormValues): void {
    // Safe to assume non-null: the resolver already parsed and range-checked this same
    // string via parseNairaToKobo before handleSubmit ever calls onValid.
    const amountKobo = parseNairaToKobo(values.amountNaira)
    if (amountKobo === null) {
      return
    }
    onNext({ amountKobo, narration: values.narration })
  }

  return (
    <Card className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          void handleSubmit(onValid)(event)
        }}
      >
        <Input
          label={sendMoneyCopy.amountField.label}
          hint={`Available: ${formatKobo(limits.balanceKobo)} · Up to ${formatKobo(limits.singleTransferLimitKobo)} per transfer`}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amountNaira?.message}
          {...register('amountNaira')}
          value={watchedValues.amountNaira ?? ''}
          onChange={handleAmountChange}
        />
        <Input
          label={sendMoneyCopy.amountField.narrationLabel}
          hint={sendMoneyCopy.amountField.narrationHint}
          maxLength={100}
          error={errors.narration?.message}
          {...register('narration')}
        />
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={!isFormValid}>
            Next
          </Button>
        </div>
      </form>
    </Card>
  )
}
