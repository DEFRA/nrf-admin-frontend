// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import {
  inflationIndexesEndpoint,
  stubInflationIndexes,
  stubInflationIndexHistory
} from '#/test-utils/stub-inflation-indexes.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import { runAxeChecks } from '#/test-utils/axe-helper.js'
import {
  addedHistory,
  amendedHistory,
  deletedHistory,
  futureIndex,
  liveIndex,
  signedInStaff,
  validAddForm
} from '#/test-utils/fixtures/inflation-index.js'

const mswServer = setupMswServer()

describe.each([
  ['inflation index page', '/inflation-index'],
  [
    'inflation index page with a notification',
    '/inflation-index?notification=inflation-index-error'
  ],
  ['inflation index details page', `/inflation-index/${futureIndex.id}`],
  ['change inflation index page', `/inflation-index/${futureIndex.id}/change`],
  ['delete inflation index page', `/inflation-index/${futureIndex.id}/delete`]
])('The %s accessibility checks', (_name, requestUrl) => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadPage({
      requestUrl,
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })
})

describe('The inflation index change history page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    stubInflationIndexHistory({
      mswServer,
      history: [deletedHistory, amendedHistory, addedHistory]
    })

    const document = await loadPage({
      requestUrl: '/inflation-index/history',
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })
})

describe('The delete inflation index page error accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues when showing errors', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })
    const { cookie } = await submitForm({
      server: getServer(),
      url: `/inflation-index/${futureIndex.id}/delete`,
      payload: { comment: '' },
      auth: signedInStaff
    })

    const document = await loadPage({
      requestUrl: `/inflation-index/${futureIndex.id}/delete`,
      server: getServer(),
      auth: signedInStaff,
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})

describe('The inflation index page load-failure accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    mswServer.use(
      http.get(
        inflationIndexesEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const document = await loadPage({
      requestUrl: '/inflation-index',
      server: getServer(),
      auth: signedInStaff
    })

    await runAxeChecks(document.documentElement)
  })
})

describe('The add inflation index page accessibility checks', () => {
  const getServer = setupTestServer()

  const stubOnlyLiveIndex = () =>
    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })

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
