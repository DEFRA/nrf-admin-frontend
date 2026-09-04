import { getByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  multipleQuotesFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

const stubQuotesResponse = (quotes) =>
  mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json(quotes)))

describe('Home page', () => {
  const getServer = setupTestServer()

  const loadHomePage = () =>
    loadPage({
      requestUrl: '/',
      server: getServer(),
      auth: authenticatedRequest
    })

  const loadHomePageWithQuotes = async (quotes) => {
    stubQuotesResponse(quotes)
    return loadHomePage()
  }

  const loadHomeTable = async (quotes) =>
    getByRole(await loadHomePageWithQuotes(quotes), 'table')

  it('renders the page title and heading', async () => {
    const document = await loadHomePageWithQuotes([])

    expect(document.title).toContain('Quotes')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Quotes'
    )
  })

  it('renders empty state message when no quotes', async () => {
    const document = await loadHomePageWithQuotes([])

    expect(document.body).toHaveTextContent('No quotes have been added yet')
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })

  it('renders a table row for each quote', async () => {
    const table = await loadHomeTable(multipleQuotesFixture)

    const rows = table.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('renders key quote fields in each row', async () => {
    const table = await loadHomeTable(singleQuoteFixture)

    expect(table).toHaveTextContent('NRL-000001')
    expect(table).toHaveTextContent('developer@housebuilder.com')
    expect(table).toHaveTextContent('Norfolk Fens East')
  })

  it('renders the boundary entry type, with the filename as an abbreviation title for uploads', async () => {
    const table = await loadHomeTable(multipleQuotesFixture)

    expect(table).toHaveTextContent('draw')
    const uploadAbbr = table.querySelector('abbr')
    expect(uploadAbbr).toHaveTextContent('upload')
    expect(uploadAbbr).toHaveAttribute('title', 'boundary.shp')
  })

  it('renders drawn boundaries as "draw", even with a leftover filename from an abandoned upload', async () => {
    const [uploadQuote, drawQuote] = multipleQuotesFixture
    const table = await loadHomeTable([
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

    expect(table).toHaveTextContent('draw')
    expect(table.querySelectorAll('abbr')).toHaveLength(1)
  })

  it('formats dates in GOV.UK format', async () => {
    const table = await loadHomeTable(singleQuoteFixture)

    expect(table).toHaveTextContent('23 March 2026')
  })

  it('renders an email delivery status tag linking to the Notify status page', async () => {
    const table = await loadHomeTable(singleQuoteFixture)

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
    const table = await loadHomeTable(multipleQuotesFixture)

    expect(table).toHaveTextContent('Sending')
    // only the delivered quote carries a Notify link
    expect(
      table.querySelectorAll('a[href*="notifications.service.gov.uk"]')
    ).toHaveLength(1)
  })

  it('renders error message when backend call fails', async () => {
    mswServer.use(
      http.get(
        quotesEndpoint,
        () =>
          new HttpResponse(null, { status: statusCodes.internalServerError })
      )
    )

    const document = await loadHomePage()

    expect(document.body).toHaveTextContent('There is a problem')
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })

  it('renders the levy amount, with the inflation adjusted amount, in EDP details', async () => {
    const table = await loadHomeTable(singleQuoteFixture)

    expect(table).toHaveTextContent('Levy: £999.00')
    expect(table).toHaveTextContent('(inflation adjusted: £999.00)')
  })

  it('links each quote reference to its quote page', async () => {
    const table = await loadHomeTable(multipleQuotesFixture)

    const quoteLink = table.querySelector('a[href="/quote/NRL-000001"]')
    expect(quoteLink).toBeInTheDocument()
    expect(quoteLink).toHaveTextContent('NRL-000001')
  })
})
