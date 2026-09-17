import { sendMoneyCopy } from '../../copy'
import { reconcile } from '../reconcile'

describe('reconcile', () => {
  it('restores with the server message for a definite http failure', () => {
    expect(
      reconcile({ kind: 'http', message: "You can't send money to your own account" }),
    ).toEqual({
      kind: 'restore',
      message: "You can't send money to your own account",
    })
  })

  it('keeps the optimistic state when the status check confirms success', () => {
    expect(reconcile({ kind: 'statusConfirmedSuccess' })).toEqual({ kind: 'keep' })
  })

  it('restores with the server message when the status check confirms failure', () => {
    expect(
      reconcile({
        kind: 'statusConfirmedFailure',
        message: 'The transfer could not be completed.',
      }),
    ).toEqual({ kind: 'restore', message: 'The transfer could not be completed.' })
  })

  it('restores with a generic message when the status check confirms failure with no server message', () => {
    expect(reconcile({ kind: 'statusConfirmedFailure', message: undefined })).toEqual({
      kind: 'restore',
      message: sendMoneyCopy.confirm.genericFailureMessage,
    })
  })

  it('restores with a generic message when the status check finds no record', () => {
    expect(reconcile({ kind: 'statusNotFound' })).toEqual({
      kind: 'restore',
      message: sendMoneyCopy.confirm.genericFailureMessage,
    })
  })

  it('restores as unconfirmed when the status check itself fails', () => {
    expect(reconcile({ kind: 'statusCheckFailed' })).toEqual({
      kind: 'restoreUnconfirmed',
      message: sendMoneyCopy.confirm.unconfirmedMessage,
    })
  })
})
