import { getByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  multipleQuotesFixture
} from '#/test-utils/fixtures/quotes.js'
import { config } from '#/config/config.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

describe('Home page', () => {
  const getServer = setupTestServer()

  const loadHomePage = () =>
    loadPage({
      requestUrl: '/',
      server: getServer(),
      auth: authenticatedRequest
    })

  it('renders the page title and heading', async () => {
    mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json([])))

    const document = await loadHomePage()

    expect(document.title).toContain('Quotes')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Quotes'
    )
  })

  it('renders empty state message when no quotes', async () => {
    mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json([])))

    const document = await loadHomePage()

    expect(document.body).toHaveTextContent('No quotes have been added yet')
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })

  it('renders a table row for each quote', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(multipleQuotesFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toBeInTheDocument()
    const rows = table.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('renders key quote fields in each row', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('NRL-000001')
    expect(table).toHaveTextContent('developer@housebuilder.com')
    expect(table).toHaveTextContent('Norfolk Fens East')
  })

  it('renders the boundary entry type, with the filename as an abbreviation title for uploads', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(multipleQuotesFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('draw')
    const uploadAbbr = table.querySelector('abbr')
    expect(uploadAbbr).toHaveTextContent('upload')
    expect(uploadAbbr).toHaveAttribute('title', 'boundary.shp')
  })

  it('renders drawn boundaries as "draw", even with a leftover filename from an abandoned upload', async () => {
    const [uploadQuote, drawQuote] = multipleQuotesFixture
    mswServer.use(
      http.get(quotesEndpoint, () =>
        HttpResponse.json([
          uploadQuote,
          {
            ...drawQuote,
            boundary: {
              ...drawQuote.boundary,
              userInputType: 'draw',
              filename: 'stale-upload.geojson'
            }
          }
        ])
      )
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('draw')
    expect(table.querySelectorAll('abbr')).toHaveLength(1)
  })

  it('formats dates in GOV.UK format', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('23 March 2026')
  })

  it('renders an email delivery status tag linking to the Notify status page', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('Delivered')
    const statusLink = table.querySelector(
      'a[href*="notifications.service.gov.uk"]'
    )
    expect(statusLink).toBeInTheDocument()
    expect(statusLink.getAttribute('href')).toBe(
      singleQuoteFixture[0].email.notifyStatusUrl
    )
    expect(statusLink.querySelector('.govuk-tag')).not.toBeNull()
  })

  it('renders a status tag without a link when no Notify status URL is present', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(multipleQuotesFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('Sending')
    // only the delivered quote carries a Notify link
    expect(
      table.querySelectorAll('a[href*="notifications.service.gov.uk"]')
    ).toHaveLength(1)
  })

  it('renders error message when backend call fails', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => new HttpResponse(null, { status: 500 }))
    )

    const document = await loadHomePage()

    expect(document.body).toHaveTextContent('There is a problem')
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })

  it('renders the levy amount, with the inflation adjusted amount, in EDP details', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('Levy: £999.00')
    expect(table).toHaveTextContent('(inflation adjusted: £999.00)')
  })

  it('links each quote reference to its quote page', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(multipleQuotesFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    const quoteLink = table.querySelector('a[href="/quote/NRL-000001"]')
    expect(quoteLink).toBeInTheDocument()
    expect(quoteLink).toHaveTextContent('NRL-000001')
  })
})
