import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  ineligibleQuoteFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

// Run as production with an approved address list so the ineligible fixture
// (created with an external address) is genuinely refused
vi.mock('#/config/config.js', async (importOriginal) => {
  const { config } = await importOriginal()
  const { productionDeleteEligibilityConfig } =
    await import('#/test-utils/production-delete-eligibility.js')
  return productionDeleteEligibilityConfig(config)
})

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`
const quoteEndpoint = `${backendUrl}/quotes/NRL-000001`

const mswServer = setupMswServer()

const stubDeleteResponse = (status) =>
  mswServer.use(
    http.delete(quoteEndpoint, () => new HttpResponse(null, { status }))
  )

const stubQuotes = (quotes = singleQuoteFixture) =>
  mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json(quotes)))

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
    stubQuotes()
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

  it('refuses to delete without calling the backend when the quote fails the eligibility check', async () => {
    stubQuotes(ineligibleQuoteFixture)

    const response = await getServer().inject({
      method: 'POST',
      url: '/quote/NRL-000003/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(
      '/?notification=quote-delete-not-eligible'
    )
  })

  it('fails safe with an error banner when eligibility cannot be checked', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => new HttpResponse(null, { status: 500 }))
    )

    const response = await getServer().inject({
      method: 'POST',
      url: '/quote/NRL-000001/delete',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/?notification=quote-delete-error')
  })

  it('redirects with a not-eligible notification when the backend forbids the delete', async () => {
    stubQuotes()
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
