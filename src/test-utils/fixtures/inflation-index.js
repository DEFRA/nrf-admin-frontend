export { signedInStaff } from './base-prices.js'

const currentYear = new Date().getUTCFullYear()

const index = ({ chargingYear, id, ...overrides }) => ({
  id,
  chargingYear,
  cilIndex: 400,
  indexFactor: 1,
  effectiveFrom: `${chargingYear}-01-01T00:00:00Z`,
  createdAt: '2026-11-01T10:00:00Z',
  comment: 'Seeded with the published RICS CIL Index values',
  staffId: 'system',
  staffFullName: 'system',
  staffEmail: 'system@nrf.invalid',
  ...overrides
})

// An index whose charging year has long passed
export const pastIndex = index({
  id: 'e6b3c2d1-6b5c-4f8e-9a2d-1c3b5a7f9e11',
  chargingYear: 2021,
  cilIndex: 333,
  indexFactor: 0.8325,
  createdAt: '2020-11-02T10:00:00Z'
})

// The index in force for the current charging year
export const liveIndex = index({
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  chargingYear: currentYear
})

// An index saved for a charging year that has not begun yet
export const futureIndex = index({
  id: 'f7e8d9c0-b1a2-4c3d-8e5f-6a7b8c9d0e1f',
  chargingYear: currentYear + 2,
  cilIndex: 384.21,
  indexFactor: 0.9605,
  comment: 'NE advice after consultation',
  staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
  staffFullName: 'Ada Admin',
  staffEmail: 'ada.admin@defra.gov.uk'
})

/** Newest year first, as the impact assessor returns them */
export const indexes = (...inflationIndexes) => inflationIndexes

export const validAddForm = {
  chargingYear: String(currentYear + 2),
  cilIndex: '384.21',
  comment: 'Following consultation'
}

export const validChangeForm = {
  cilIndex: '390.5',
  comment: 'Revised after checking'
}
