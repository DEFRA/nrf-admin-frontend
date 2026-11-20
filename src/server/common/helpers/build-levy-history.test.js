import { buildLevyHistory } from './build-levy-history.js'
import {
  currentLevyCalculation as current,
  previousLevyCalculation as previous
} from '#/test-utils/fixtures/levy-history.js'

describe('#buildLevyHistory', () => {
  it('puts the current and previous calculations in one list in the same shape', () => {
    const [first, second] = buildLevyHistory({
      levyGbp: current,
      previousLevyCalculations: [previous]
    })

    expect(first).toEqual({
      journey: 'request_to_use',
      calculatedAt: '2026-11-17T12:00:00.000Z',
      provisionalAmount: '30000.00',
      inflationAdjustedAmount: '31000.00',
      originalBaseAmount: '25000.00',
      baseChargePerUnit: '3000.00',
      originalBaseChargePerUnit: '2500.00',
      units: 10,
      modelVersion: 2
    })
    expect(second).toMatchObject({
      journey: 'quote',
      provisionalAmount: '26750.00'
    })
  })

  it('sorts by calculation date, most recent first, whatever order they arrive in', () => {
    const oldest = { ...previous, calculatedAt: '2026-01-01T00:00:00.000Z' }

    const history = buildLevyHistory({
      levyGbp: { ...current, calculatedAt: '2026-06-01T00:00:00.000Z' },
      previousLevyCalculations: [oldest, previous]
    })

    expect(history.map((entry) => entry.calculatedAt)).toEqual([
      '2026-09-14T10:30:15.000Z',
      '2026-06-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z'
    ])
  })

  it('copes with a quote that has no previous calculations', () => {
    expect(buildLevyHistory({ levyGbp: current })).toHaveLength(1)
  })
})
