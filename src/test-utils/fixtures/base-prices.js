export const signedInStaff = {
  strategy: 'session',
  credentials: {
    isAuthenticated: true,
    id: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
    displayName: 'Ada Admin',
    email: 'ada.admin@defra.gov.uk'
  }
}

export const pastBasePrice = {
  id: 1,
  edpId: 1,
  basePrice: 2675,
  createdAt: '2025-12-01T10:00:00Z',
  effectiveFrom: '2026-01-01T00:00:00Z',
  comment: 'Provisional base price from the charging schedule',
  requestor: null,
  jiraTicket: null,
  staffId: 'system',
  staffFullName: 'system',
  staffEmail: 'system@example.com'
}

// 00:00 on 1 March 2099, which is UTC in UK winter time
export const futureBasePrice = {
  id: 2,
  edpId: 1,
  basePrice: 2800.5,
  createdAt: '2026-11-01T10:00:00Z',
  effectiveFrom: '2099-03-01T00:00:00Z',
  comment: 'NE advice after consultation',
  requestor: 'Grace Hopper',
  jiraTicket: 'NRF2-1234',
  staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
  staffFullName: 'Ada Admin',
  staffEmail: 'ada.admin@defra.gov.uk'
}

export const edpName = 'Test nutrient EDP'

export const edpWithHistory = (...basePrices) => [
  { edpId: 1, edpName, basePrices }
]

export const validBasePriceForm = {
  basePrice: '2900.25',
  'effectiveFrom-day': '1',
  'effectiveFrom-month': '7',
  'effectiveFrom-year': '2099',
  effectiveFromTime: '09:30',
  requestor: 'Alan Turing',
  jiraTicket: 'NRF2-2000',
  comment: 'Following consultation'
}
