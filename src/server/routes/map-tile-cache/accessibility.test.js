// @vitest-environment jsdom
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import { runAxeChecks } from '#/test-utils/axe-helper.js'

describe('Map tile cache page accessibility checks', () => {
  const getServer = setupTestServer()

  it.each([
    ['/map-tile-cache'],
    ['/map-tile-cache?notification=tile-cache-cleared&count=2']
  ])('%s should have no HTML accessibility issues', async (requestUrl) => {
    const document = await loadPage({
      requestUrl,
      server: getServer(),
      auth: authenticatedRequest
    })

    await runAxeChecks(document.documentElement)
  })
})
