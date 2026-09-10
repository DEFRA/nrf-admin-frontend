import { getByRole } from '@testing-library/dom'
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
const quoteEndpoint = `${backendUrl}/quotes/NRL-000001`

const mswServer = setupMswServer()

const stubDeleteResponse = (status) =>
  mswServer.use(
    http.delete(quoteEndpoint, () => new HttpResponse(null, { status }))
  )

describe('Delete quote confirmation page', () => {
  const getServer = setupTestServer()

  it('renders the confirmation page with what will be deleted', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadPage({
      requestUrl: '/quote/NRL-000001/delete',
      server: getServer(),
      auth: authenticatedRequest
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Delete quote NRL-000001?'
    )
    expect(document.body).toHaveTextContent(
      'Deleting this quote is permanent and cannot be undone.'
    )
    expect(document.body).toHaveTextContent('developer@housebuilder.com')
    expect(document.body).toHaveTextContent('the levy (EDP) results')
    expect(
      getByRole(document, 'button', { name: 'Yes, delete this quote' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'link', { name: 'Cancel and return to the quote' })
    ).toHaveAttribute('href', '/quote/NRL-000001')
  })

  it('returns a 404 page for an unknown quote reference', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const response = await getServer().inject({
      method: 'GET',
      url: '/quote/NRL-999999/delete',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
  })

  it('returns a 403 page when the quote is not eligible for deletion', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(ineligibleQuoteFixture))
    )

    const response = await getServer().inject({
      method: 'GET',
      url: '/quote/NRL-000003/delete',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.forbidden)
  })

  it('returns a 400 page when the reference format is invalid', async () => {
    const getResponse = await getServer().inject({
      method: 'GET',
      url: '/quote/not-a-reference/delete',
      auth: authenticatedRequest
    })
    const postResponse = await getServer().inject({
      method: 'POST',
      url: '/quote/not-a-reference/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(getResponse.statusCode).toBe(statusCodes.badRequest)
    expect(postResponse.statusCode).toBe(statusCodes.badRequest)
  })

  it('deletes the quote and redirects to the quotes list', async () => {
    stubDeleteResponse(statusCodes.noContent)

    const response = await getServer().inject({
      method: 'POST',
      url: '/quote/NRL-000001/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quote-deleted&reference=NRL-000001'
    )
  })

  it('redirects with a not-eligible notification when the backend forbids the delete', async () => {
    stubDeleteResponse(statusCodes.forbidden)

    const response = await getServer().inject({
      method: 'POST',
      url: '/quote/NRL-000001/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quote-delete-not-eligible'
    )
  })

  it('redirects with an error notification when the backend rejects the delete', async () => {
    stubDeleteResponse(statusCodes.internalServerError)

    const response = await getServer().inject({
      method: 'POST',
      url: '/quote/NRL-000001/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/?notification=quote-delete-error')
  })
})
