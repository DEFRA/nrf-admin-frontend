// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  ineligibleQuoteFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`
const deleteEndpoint = (reference) => `${backendUrl}/quotes/${reference}`
const bulkDeleteUrl = '/quotes/delete'

const mswServer = setupMswServer()

const stubQuotes = () =>
  mswServer.use(
    http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
  )

const stubDelete = (reference, status) =>
  mswServer.use(
    http.delete(
      deleteEndpoint(reference),
      () => new HttpResponse(null, { status })
    )
  )

describe('Bulk delete quotes confirmation page', () => {
  const getServer = setupTestServer()

  it('renders the selected quotes with a confirmation button', async () => {
    stubQuotes()

    const document = await loadPage({
      requestUrl: '/quotes/delete?references=NRL-000001',
      server: getServer(),
      auth: authenticatedRequest
    })

    expect(document.body).toHaveTextContent('Delete 1 quote?')
    expect(document.body).toHaveTextContent('NRL-000001')
    expect(document.body).toHaveTextContent('developer@housebuilder.com')
    expect(document.body).toHaveTextContent(
      'Deleting these quotes is permanent and cannot be undone.'
    )
    expect(
      document.querySelector(
        'form[action="/quotes/delete"] input[name="references"][value="NRL-000001"]'
      )
    ).not.toBeNull()
  })

  it('omits selected quotes that are not eligible for deletion', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(ineligibleQuoteFixture))
    )

    const response = await getServer().inject({
      method: 'GET',
      url: '/quotes/delete?references=NRL-000003',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/?notification=quotes-bulk-none-selected'
    )
  })

  it('rejects references that do not match the NRL format', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/quotes/delete?references=not-a-reference',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })

  it('deletes the selected quotes and redirects to the quotes list', async () => {
    stubDelete('NRL-000001', statusCodes.noContent)
    stubDelete('NRL-000002', statusCodes.noContent)

    const response = await getServer().inject({
      method: 'POST',
      url: bulkDeleteUrl,
      payload: { references: ['NRL-000001', 'NRL-000002'] },
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quotes-deleted&deletedCount=2'
    )
  })

  it('reports a partial failure when some quotes cannot be deleted', async () => {
    stubDelete('NRL-000001', statusCodes.noContent)
    stubDelete('NRL-000002', statusCodes.internalServerError)

    const response = await getServer().inject({
      method: 'POST',
      url: bulkDeleteUrl,
      payload: { references: ['NRL-000001', 'NRL-000002'] },
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quotes-delete-partial&deletedCount=1&totalCount=2'
    )
  })

  it('reports a not-eligible banner when every quote is rejected as forbidden', async () => {
    stubDelete('NRL-000001', statusCodes.forbidden)

    const response = await getServer().inject({
      method: 'POST',
      url: bulkDeleteUrl,
      payload: { references: ['NRL-000001'] },
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quotes-delete-not-eligible'
    )
  })

  it('reports a failure when no quotes could be deleted', async () => {
    stubDelete('NRL-000001', statusCodes.internalServerError)

    const response = await getServer().inject({
      method: 'POST',
      url: bulkDeleteUrl,
      payload: { references: ['NRL-000001'] },
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quotes-delete-failed'
    )
  })

  it('rejects a payload with no references', async () => {
    const response = await getServer().inject({
      method: 'POST',
      url: '/quotes/delete',
      payload: { references: [] },
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })
})
