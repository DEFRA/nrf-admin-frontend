import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  futureIndex,
  indexes,
  liveIndex,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'
import { config } from '#/config/config.js'

const deleteUrl = `/inflation-index/${futureIndex.id}/delete`
const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer()

const stubInflationIndexes = (...inflationIndexes) =>
  mswServer.use(
    http.get(inflationIndexesEndpoint, () =>
      HttpResponse.json(indexes(...inflationIndexes))
    )
  )

describe('Delete inflation index page', () => {
  const getServer = setupTestServer()

  const submitDeleteForm = () =>
    submitForm({
      server: getServer(),
      url: deleteUrl,
      payload: {},
      auth: signedInStaff
    })

  it('shows what will be deleted and the consequence', async () => {
    stubInflationIndexes(futureIndex, liveIndex)

    const document = await loadPage({
      requestUrl: deleteUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Delete this inflation index?'
    )
    expect(document.body).toHaveTextContent(
      'The inflation index will not apply'
    )
    expect(document.body).toHaveTextContent(String(futureIndex.chargingYear))
    expect(document.body).toHaveTextContent('384.21')
    expect(document.body).toHaveTextContent('0.9605')
    expect(document.body).toHaveTextContent('1 January')
    expect(
      getByRole(document, 'button', {
        name: 'Yes, delete this inflation index'
      })
    ).toBeInTheDocument()
  })

  it('sends the user back when the year has already begun', async () => {
    stubInflationIndexes(liveIndex)

    const response = await getServer().inject({
      method: 'GET',
      url: `/inflation-index/${liveIndex.id}/delete`,
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-taken-effect'
    )
  })

  it('deletes the index and says the existing one continues to apply', async () => {
    stubInflationIndexes(futureIndex, liveIndex)
    mswServer.use(
      http.delete(
        `${inflationIndexesEndpoint}/${futureIndex.id}`,
        () => new HttpResponse(null, { status: 204 })
      )
    )

    const { response } = await submitDeleteForm()

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-deleted'
    )
  })

  it.each([
    [
      409,
      {
        detail: {
          error: 'inflation_index_in_use',
          message: 'has been used to price a quote'
        }
      },
      'inflation-index-in-use'
    ],
    [
      409,
      {
        detail: {
          error: 'inflation_index_taken_effect',
          message: 'has taken effect'
        }
      },
      'inflation-index-taken-effect'
    ],
    [
      409,
      {
        detail: {
          error: 'inflation_index_something_new',
          message: 'a reason added later'
        }
      },
      'inflation-index-error'
    ],
    [404, { detail: 'not found' }, 'inflation-index-not-found'],
    [500, { detail: 'boom' }, 'inflation-index-error']
  ])(
    'reports a %d from the impact assessor as %s',
    async (statusCode, body, notification) => {
      stubInflationIndexes(futureIndex, liveIndex)
      mswServer.use(
        http.delete(`${inflationIndexesEndpoint}/${futureIndex.id}`, () =>
          HttpResponse.json(body, { status: statusCode })
        )
      )

      const { response } = await submitDeleteForm()

      expect(response.headers.location).toBe(
        `/inflation-index?notification=${notification}`
      )
    }
  )
})
