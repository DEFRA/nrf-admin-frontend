// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import { runAxeChecks } from '#/test-utils/axe-helper.js'
import {
  futureIndex,
  indexes,
  liveIndex,
  signedInStaff,
  validAddForm
} from '#/test-utils/fixtures/inflation-index.js'
import { config } from '#/config/config.js'

const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer(
  http.get(inflationIndexesEndpoint, () =>
    HttpResponse.json(indexes(futureIndex, liveIndex))
  )
)

describe.each([
  ['inflation index page', '/inflation-index'],
  [
    'inflation index page with a notification',
    '/inflation-index?notification=inflation-index-error'
  ],
  ['change inflation index page', `/inflation-index/${futureIndex.id}/change`],
  ['delete inflation index page', `/inflation-index/${futureIndex.id}/delete`]
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

describe('The add inflation index page accessibility checks', () => {
  const getServer = setupTestServer()

  const stubOnlyLiveIndex = () =>
    mswServer.use(
      http.get(inflationIndexesEndpoint, () =>
        HttpResponse.json(indexes(liveIndex))
      )
    )

  it('should have no HTML accessibility issues', async () => {
    stubOnlyLiveIndex()

    const document = await loadPage({
      requestUrl: '/inflation-index/add',
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues when showing errors', async () => {
    stubOnlyLiveIndex()
    const { cookie } = await submitForm({
      server: getServer(),
      url: '/inflation-index/add',
      payload: { ...validAddForm, chargingYear: '', comment: '' },
      auth: signedInStaff
    })

    const document = await loadPage({
      requestUrl: '/inflation-index/add',
      server: getServer(),
      auth: signedInStaff,
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
