import { vi } from 'vitest'

import { formatDate, formatDateTime } from './format-date.js'

describe('#formatDate', () => {
  beforeAll(() => {
    vi.useFakeTimers({
      now: new Date('2023-02-01')
    })
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('With defaults', () => {
    test('Date should be in expected format', () => {
      expect(formatDate('2023-02-01T11:40:02.242Z')).toBe(
        'Wed 1st February 2023'
      )
    })
  })

  describe('With Date object', () => {
    test('Date should be in expected format', () => {
      expect(formatDate(new Date())).toBe('Wed 1st February 2023')
    })
  })

  describe('With format attribute', () => {
    test('Date should be in provided format', () => {
      expect(
        formatDate(
          '2023-02-01T11:40:02.242Z',
          "h:mm aaa 'on' EEEE do MMMM yyyy"
        )
      ).toBe('11:40 am on Wednesday 1st February 2023')
    })
  })
})

describe('#formatDateTime', () => {
  test('formats an ISO string as "d MMM yyyy at HH:mm"', () => {
    expect(formatDateTime('2026-01-08T08:35:00.000Z')).toBe(
      '8 Jan 2026 at 08:35'
    )
  })

  test('formats a Date object', () => {
    expect(formatDateTime(new Date('2026-01-08T08:35:00.000Z'))).toBe(
      '8 Jan 2026 at 08:35'
    )
  })
})
