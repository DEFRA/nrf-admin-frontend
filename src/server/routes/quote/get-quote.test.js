import { http, HttpResponse } from 'msw'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { singleQuoteFixture } from '#/test-utils/fixtures/quotes.js'
import { config } from '#/config/config.js'
import { getQuote } from './get-quote.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

describe('#getQuote', () => {
  it('should return the quote matching the reference', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const result = await getQuote('NRL-000001')

    expect(result).toEqual({ quote: singleQuoteFixture[0] })
  })

  it('should return a null quote when no quote matches the reference', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const result = await getQuote('NRL-999999')

    expect(result).toEqual({ quote: null })
  })

  it('should return an error message when the backend call fails', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => new HttpResponse(null, { status: 500 }))
    )

    const result = await getQuote('NRL-000001')

    expect(result).toEqual({
      errorMessage: 'An error occurred getting the quote'
    })
  })
})
