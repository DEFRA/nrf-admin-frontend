import { getByLabelText, getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  futureIndex,
  indexes,
  liveIndex,
  signedInStaff,
  validChangeForm
} from '#/test-utils/fixtures/inflation-index.js'
import { config } from '#/config/config.js'

const changeUrl = `/inflation-index/${futureIndex.id}/change`
const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer()

const stubInflationIndexes = (...inflationIndexes) =>
  mswServer.use(
    http.get(inflationIndexesEndpoint, () =>
      HttpResponse.json(indexes(...inflationIndexes))
    )
  )

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
    stubInflationIndexes(futureIndex, liveIndex)

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
    expect(getByLabelText(document, 'Comment')).toHaveValue(
      'NE advice after consultation'
    )
  })

  it('sends the user back when the year has already begun', async () => {
    stubInflationIndexes(liveIndex)

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
    stubInflationIndexes(futureIndex, liveIndex)
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
      comment: 'Revised after checking',
      staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
      staffFullName: 'Ada Admin',
      staffEmail: 'ada.admin@defra.gov.uk'
    })
  })

  it.each([
    [409, 'inflation-index-taken-effect'],
    [404, 'inflation-index-not-found'],
    [500, 'inflation-index-error']
  ])(
    'reports a %d from the impact assessor',
    async (statusCode, notification) => {
      stubInflationIndexes(futureIndex, liveIndex)
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
