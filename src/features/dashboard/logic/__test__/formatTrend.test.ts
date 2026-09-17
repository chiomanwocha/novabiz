import { toKobo } from '../../../../lib/money'
import { describeWeekOverWeekTrend } from '../formatTrend'

describe('describeWeekOverWeekTrend', () => {
  it('reports a rounded positive change as "up"', () => {
    expect(describeWeekOverWeekTrend(toKobo(118_000), toKobo(100_000))).toEqual({
      direction: 'up',
      summary: '+18% vs last week',
    })
  })

  it('reports a negative change as "down"', () => {
    expect(describeWeekOverWeekTrend(toKobo(80_000), toKobo(100_000))).toEqual({
      direction: 'down',
      summary: '-20% vs last week',
    })
  })

  it('reports no change as "flat"', () => {
    expect(describeWeekOverWeekTrend(toKobo(100_000), toKobo(100_000))).toEqual({
      direction: 'flat',
      summary: 'Same as last week',
    })
  })

  it('avoids dividing by zero when last week had no inflow at all', () => {
    expect(describeWeekOverWeekTrend(toKobo(0), toKobo(0))).toEqual({
      direction: 'flat',
      summary: 'No money in yet this week',
    })
  })

  it('reports new inflow after a zero week as "up"', () => {
    expect(describeWeekOverWeekTrend(toKobo(50_000), toKobo(0))).toEqual({
      direction: 'up',
      summary: 'New this week',
    })
  })
})
