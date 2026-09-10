// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import { runAxeChecks } from '#/test-utils/axe-helper.js'
import { singleQuoteFixture } from '#/test-utils/fixtures/quotes.js'
import { config } from '#/config/config.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

describe('Home page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadPage({
      requestUrl: '/',
      server: getServer(),
      auth: authenticatedRequest
    })

    await runAxeChecks(document.documentElement)
  })
})
