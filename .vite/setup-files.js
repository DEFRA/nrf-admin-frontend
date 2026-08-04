import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('ioredis')
vi.mock('@defra/cdp-auditing', () => ({
  audit: vi.fn(),
  enableAuditing: vi.fn()
}))
