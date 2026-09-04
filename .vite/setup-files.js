import '@testing-library/jest-dom/vitest'
import * as axeMatchers from 'vitest-axe/matchers'
import { vi } from 'vitest'

vi.mock('ioredis')
vi.mock('@defra/cdp-auditing', () => ({
  audit: vi.fn(),
  enableAuditing: vi.fn()
}))

expect.extend(axeMatchers)
