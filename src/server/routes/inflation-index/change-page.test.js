import { getByLabelText, getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import {
  inflationIndexesEndpoint,
  stubInflationIndexes
} from '#/test-utils/stub-inflation-indexes.js'
import { loadPage, loadPageWithCookie } from '#/test-utils/load-page.js'
import { getSessionCookie } from '#/test-utils/session-cookie.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  futureIndex,
  liveIndex,
  signedInStaff,
  validChangeForm
} from '#/test-utils/fixtures/inflation-index.js'

const changeUrl = `/inflation-index/${futureIndex.id}/change`
const mswServer = setupMswServer()

describe('Change inflation index page', () => {
  const getServer = setupTestServer()

  const submitChangeForm = (payload) =>
    submitForm({
      server: getServer(),
      url: changeUrl,
      payload,
      auth: signedInStaff
    })

  it('shows the fixed year and the saved index', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Change the inflation index'
    )
    expect(document.body).toHaveTextContent(String(futureIndex.chargingYear))
    expect(getByLabelText(document, 'RICS CIL Index')).toHaveValue('384.21')
    expect(getByLabelText(document, 'Requester')).toHaveValue('Grace Hopper')
    expect(getByLabelText(document, 'Jira ticket')).toHaveValue('NRF2-1234')
    expect(getByLabelText(document, 'Comment')).toHaveValue(
      'NE advice after consultation'
    )
  })

  it('sends the user back when the year has already begun', async () => {
    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })

    const response = await getServer().inject({
      method: 'GET',
      url: `/inflation-index/${liveIndex.id}/change`,
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-taken-effect'
    )
  })

  it('changes the index without the year, with the user from the session', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })
    let sent
    mswServer.use(
      http.patch(
        `${inflationIndexesEndpoint}/${futureIndex.id}`,
        async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json(futureIndex, { status: 200 })
        }
      )
    )

    const { response } = await submitChangeForm(validChangeForm)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-changed'
    )
    expect(sent).toEqual({
      cilIndex: 390.5,
      requestor: 'Alan Turing',
      jiraTicket: 'NRF2-2000',
      comment: 'Revised after checking',
      staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
      staffFullName: 'Ada Admin',
      staffEmail: 'ada.admin@defra.gov.uk'
    })
  })

  it('does not carry a rejected change into the add form', async () => {
    const { cookie } = await submitChangeForm({
      ...validChangeForm,
      cilIndex: '7777',
      comment: ''
    })
    // The change form's flash is keyed to its own path; when the year has
    // since begun the user is sent to the list, never to a polluted add form
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [
        {
          ...futureIndex,
          chargingYear: liveIndex.chargingYear,
          effectiveFrom: `${liveIndex.chargingYear}-01-01T00:00:00Z`
        }
      ]
    })
    const rejected = await getServer().inject({
      method: 'GET',
      url: changeUrl,
      auth: signedInStaff,
      headers: { cookie }
    })

    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })
    const { document } = await loadPageWithCookie({
      requestUrl: '/inflation-index/add',
      server: getServer(),
      auth: signedInStaff,
      cookie: getSessionCookie(rejected) || cookie
    })

    expect(rejected.headers.location).toBe(
      '/inflation-index?notification=inflation-index-taken-effect'
    )
    expect(getByLabelText(document, 'RICS CIL Index')).toHaveValue('')
  })

  it.each([
    [409, 'inflation-index-taken-effect'],
    [404, 'inflation-index-not-found'],
    [500, 'inflation-index-error']
  ])(
    'reports a %d from the impact assessor',
    async (statusCode, notification) => {
      stubInflationIndexes({
        mswServer,
        inflationIndexes: [futureIndex, liveIndex]
      })
      mswServer.use(
        http.patch(`${inflationIndexesEndpoint}/${futureIndex.id}`, () =>
          HttpResponse.json({ detail: 'no' }, { status: statusCode })
        )
      )

      const { response } = await submitChangeForm(validChangeForm)

      expect(response.headers.location).toBe(
        `/inflation-index?notification=${notification}`
      )
    }
  )
})
