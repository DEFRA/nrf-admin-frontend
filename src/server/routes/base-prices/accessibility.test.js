// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import { runAxeChecks } from '#/test-utils/axe-helper.js'
import {
  edpWithHistory,
  futureBasePrice,
  pastBasePrice,
  signedInStaff,
  validBasePriceForm
} from '#/test-utils/fixtures/base-prices.js'
import { config } from '#/config/config.js'

const mswServer = setupMswServer(
  http.get(`${config.get('impactAssessor.apiUrl')}/base-prices`, () =>
    HttpResponse.json(edpWithHistory(futureBasePrice, pastBasePrice))
  )
)

describe.each([
  ['base prices page', '/base-prices'],
  [
    'base prices page with a notification',
    '/base-prices?notification=base-price-error'
  ],
  ['base price details page', '/base-prices/2'],
  ['change base price page', '/base-prices/2/change'],
  ['delete base price page', '/base-prices/2/delete']
])('The %s accessibility checks', (_name, requestUrl) => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl,
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })
})

describe('The add base price page accessibility checks', () => {
  const getServer = setupTestServer()

  const stubNoFutureBasePrice = () =>
    mswServer.use(
      http.get(`${config.get('impactAssessor.apiUrl')}/base-prices`, () =>
        HttpResponse.json(edpWithHistory(pastBasePrice))
      )
    )

  it('should have no HTML accessibility issues', async () => {
    stubNoFutureBasePrice()

    const document = await loadPage({
      requestUrl: '/base-prices/add',
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues when showing errors', async () => {
    stubNoFutureBasePrice()
    const { cookie } = await submitForm({
      server: getServer(),
      url: '/base-prices/add',
      payload: { ...validBasePriceForm, basePrice: '', comment: '' },
      auth: signedInStaff
    })

    const document = await loadPage({
      requestUrl: '/base-prices/add',
      server: getServer(),
      auth: signedInStaff,
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
