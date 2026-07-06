import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'

const fetchMock = createFetchMock(vi)

fetchMock.enableMocks()
global.fetch = fetchMock

vi.mock('ioredis')
vi.mock('@defra/cdp-auditing', () => ({
  audit: vi.fn(),
  enableAuditing: vi.fn()
}))
