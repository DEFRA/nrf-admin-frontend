import { describe, expect, it } from 'vitest'

import { toTableRows } from './table-rows.js'

const viewModel = ({ chargingYear, isFuture, isInForce }) => ({
  id: `00000000-0000-4000-8000-${String(chargingYear)}`,
  chargingYear,
  cilIndex: 384.21,
  indexFactor: 0.96052,
  isFuture,
  isInForce,
  detailsPath: `/inflation-index/id-${chargingYear}`,
  changePath: `/inflation-index/id-${chargingYear}/change`,
  deletePath: `/inflation-index/id-${chargingYear}/delete`
})

describe('toTableRows', () => {
  it('renders the year, index and factor for each row', () => {
    const rows = toTableRows({
      inflationIndexes: [
        viewModel({ chargingYear: 2028, isFuture: true, isInForce: false })
      ]
    })

    expect(rows).toHaveLength(1)
    const [year, cilIndex, factor] = rows[0]
    expect(year.html).toBe('2028')
    expect(cilIndex).toEqual({ text: 384.21, format: 'numeric' })
    expect(factor).toEqual({ text: '0.9605', format: 'numeric' })
  })

  it('marks the index in force for the current charging year', () => {
    const rows = toTableRows({
      inflationIndexes: [
        viewModel({ chargingYear: 2026, isFuture: false, isInForce: true })
      ]
    })

    expect(rows[0][0].html).toContain('govuk-tag--blue')
    expect(rows[0][0].html).toContain('In force')
  })

  it('offers only the details link for an index whose year has begun', () => {
    const rows = toTableRows({
      inflationIndexes: [
        viewModel({ chargingYear: 2026, isFuture: false, isInForce: true })
      ]
    })

    const actions = rows[0][3].html
    expect(actions).toContain('href="/inflation-index/id-2026"')
    expect(actions).toContain('View details')
    expect(actions).not.toContain('Change')
    expect(actions).not.toContain('Delete')
  })

  it('offers change and delete alongside details for a future index', () => {
    const rows = toTableRows({
      inflationIndexes: [
        viewModel({ chargingYear: 2028, isFuture: true, isInForce: false })
      ]
    })

    const actions = rows[0][3].html
    expect(actions).toContain('href="/inflation-index/id-2028/change"')
    expect(actions).toContain('href="/inflation-index/id-2028/delete"')
    expect(actions).toContain('the inflation index for 2028')
  })
})
