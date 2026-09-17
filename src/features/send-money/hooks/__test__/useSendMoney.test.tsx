import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { postNameEnquiry } from '../../../../api/endpoints/nameEnquiry'
import { transactionsQueryKey } from '../../../../api/endpoints/transactions'
import type { MerchantDto, TransactionsPageDto } from '../../../../api/types'
import { toKobo } from '../../../../lib/money'
import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import type { ResolvedRecipient } from '../../steps/RecipientStep'
import { useSendMoney } from '../useSendMoney'

// The real REQUEST_TIMEOUT_MS is 10s — mocked small so the timeout case doesn't make the
// suite slow. Hoisted above other statements, so the factory can't reference an outer variable.
vi.mock('../../../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../config/constants')>()),
  REQUEST_TIMEOUT_MS: 300,
}))

const mockTimeoutMs = 300

setupMockServer()

const BANK_CODE = '011'
const ACCOUNT_NUMBER = '0102030400'
const AMOUNT = { amountKobo: toKobo(100_050), narration: 'Stock top-up' }

const CLIENT_MERCHANT: MerchantDto = {
  name: 'Amaka Provisions',
  accountNumber: '0011223344',
  bankCode: '058',
  balanceKobo: toKobo(20_000_00),
  todayInflowKobo: toKobo(0),
  todayOutflowKobo: toKobo(50_000),
  kycTier: 2,
  singleTransferLimitKobo: toKobo(500_000),
  dailyLimitKobo: toKobo(2_000_000),
  usedTodayKobo: toKobo(300_000),
}

const CLIENT_TRANSACTIONS: InfiniteData<TransactionsPageDto> = {
  pages: [{ transactions: [], nextCursor: null, total: 0 }],
  pageParams: [null],
}

function createSeededClient(): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(['merchant'], CLIENT_MERCHANT)
  // Seeded at the same canonical key useTransactions() actually queries against (all five
  // filter fields present, not `{}`) — this is what caught the real bug where useSendMoney's
  // optimistic write targeted a cache entry nothing on the dashboard was reading.
  client.setQueryData(transactionsQueryKey(), CLIENT_TRANSACTIONS)
  return client
}

async function resolveRecipient(): Promise<ResolvedRecipient> {
  const { accountName, nameEnquiryRef } = await postNameEnquiry({
    accountNumber: ACCOUNT_NUMBER,
    bankCode: BANK_CODE,
  })
  return {
    bankCode: BANK_CODE,
    bankName: 'First Bank of Nigeria',
    accountNumber: ACCOUNT_NUMBER,
    accountName,
    nameEnquiryRef,
  }
}

describe('useSendMoney', () => {
  beforeEach(() => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
  })

  it('optimistically debits the balance and prepends a pending row on send', async () => {
    const recipient = await resolveRecipient()
    const client = createSeededClient()
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
    const { result } = renderHook(() => useSendMoney(), { wrapper })

    act(() => {
      result.current.send({ idempotencyKey: 'key-optimistic', recipient, amount: AMOUNT })
    })

    await waitFor(() => {
      expect(result.current.status.state).not.toBe('idle')
    })

    const merchant = client.getQueryData<MerchantDto>(['merchant'])
    const transactions =
      client.getQueryData<InfiniteData<TransactionsPageDto>>(transactionsQueryKey())
    expect(merchant?.balanceKobo).toBe(20_000_00 - 100_050)
    expect(transactions?.pages[0]?.transactions[0]).toMatchObject({
      status: 'pending',
      amountKobo: 100_050,
    })
  })

  it('shows "Transfer sent" and keeps the debit on success', async () => {
    const recipient = await resolveRecipient()
    const client = createSeededClient()
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
    const { result } = renderHook(() => useSendMoney(), { wrapper })

    act(() => {
      result.current.send({ idempotencyKey: 'key-success', recipient, amount: AMOUNT })
    })

    await waitFor(() => {
      expect(result.current.status).toEqual({ state: 'sent' })
    })

    const merchant = client.getQueryData<MerchantDto>(['merchant'])
    expect(merchant?.balanceKobo).toBe(20_000_00 - 100_050)
  })

  it('restores the exact original balance and feed on a definite (500) failure', async () => {
    const recipient = await resolveRecipient()
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const client = createSeededClient()
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
    const { result } = renderHook(() => useSendMoney(), { wrapper })

    act(() => {
      result.current.send({ idempotencyKey: 'key-fail', recipient, amount: AMOUNT })
    })

    await waitFor(() => {
      expect(result.current.status.state).toBe('failed')
    })

    const merchant = client.getQueryData<MerchantDto>(['merchant'])
    const transactions =
      client.getQueryData<InfiniteData<TransactionsPageDto>>(transactionsQueryKey())
    expect(merchant).toEqual(CLIENT_MERCHANT)
    expect(transactions).toEqual(CLIENT_TRANSACTIONS)
  })

  it('keeps the debit, with no rollback, when a timeout meant the server actually applied it', async () => {
    const recipient = await resolveRecipient()
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: true })
    const client = createSeededClient()
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
    const { result } = renderHook(() => useSendMoney(), { wrapper })

    act(() => {
      result.current.send({ idempotencyKey: 'key-timeout', recipient, amount: AMOUNT })
    })

    await waitFor(
      () => {
        expect(result.current.status).toEqual({ state: 'sent' })
      },
      { timeout: mockTimeoutMs * 20 },
    )

    const merchant = client.getQueryData<MerchantDto>(['merchant'])
    expect(merchant?.balanceKobo).toBe(20_000_00 - 100_050)
  })
})
