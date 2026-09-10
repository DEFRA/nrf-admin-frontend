import { getByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  multipleQuotesFixture,
  ineligibleQuoteFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

const stubQuotesResponse = (quotes) =>
  mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json(quotes)))

const problemBannerTitle = 'There is a problem'

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

    expect(document.body).toHaveTextContent(problemBannerTitle)
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

  it.each([
    {
      description: 'a success banner after a quote is deleted',
      url: '/?notification=quote-deleted&reference=NRL-000001',
      expectedText: ['Success', 'Quote NRL-000001 was deleted.']
    },
    {
      description: 'an error banner when a quote delete fails',
      url: '/?notification=quote-delete-error',
      expectedText: [problemBannerTitle, 'Failed to delete the quote']
    },
    {
      description:
        'a banner explaining when a quote is not eligible for deletion',
      url: '/?notification=quote-delete-not-eligible',
      expectedText: [
        'This quote cannot be deleted because it was not created with an approved internal email address.'
      ]
    },
    {
      description: 'a success banner after quotes are bulk deleted',
      url: '/?notification=quotes-deleted&deletedCount=2',
      expectedText: ['Success', '2 quotes were deleted.']
    },
    {
      description:
        'a partial failure banner when only some quotes were deleted',
      url: '/?notification=quotes-delete-partial&deletedCount=1&totalCount=2',
      expectedText: [problemBannerTitle, '1 of 2 selected quotes were deleted']
    },
    {
      description: 'a failure banner when no quotes could be deleted',
      url: '/?notification=quotes-delete-failed',
      expectedText: [problemBannerTitle, 'No quotes were deleted']
    },
    {
      description: 'a banner when no bulk-deleted quote was eligible',
      url: '/?notification=quotes-delete-not-eligible',
      expectedText: [
        'No quotes were deleted because they were not created with an approved internal email address.'
      ]
    },
    {
      description: 'a banner prompting a selection when no quote was ticked',
      url: '/?notification=quotes-bulk-none-selected',
      expectedText: ['Select at least one quote to delete.']
    }
  ])('renders $description', async ({ url, expectedText }) => {
    stubQuotesResponse(singleQuoteFixture)

    const document = await loadPage({
      requestUrl: url,
      server: getServer(),
      auth: authenticatedRequest
    })

    for (const text of expectedText) {
      expect(document.body).toHaveTextContent(text)
    }
  })

  it('rejects query parameters that do not match the expected types', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/?notification=quotes-deleted&deletedCount=not-a-number',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })

  it('renders a checkbox for each eligible quote and a select-all checkbox', async () => {
    const table = await loadHomeTable([
      ineligibleQuoteFixture[0],
      singleQuoteFixture[0]
    ])

    const selectAll = table.querySelector('#select-all-quotes')
    expect(selectAll).not.toBeNull()
    expect(
      getByRole(table, 'checkbox', { name: 'Select all eligible quotes' })
    ).toBeInTheDocument()

    const checkboxes = table.querySelectorAll('input[name="references"]')
    expect(checkboxes).toHaveLength(1)
    expect(checkboxes[0].getAttribute('value')).toBe('NRL-000001')
    expect(
      getByRole(table, 'checkbox', { name: 'Select quote NRL-000001' })
    ).toBeInTheDocument()
  })

  it('wraps the table in a bulk delete form when any quote is eligible', async () => {
    const document = await loadHomePageWithQuotes(singleQuoteFixture)

    const form = document.querySelector('form[action="/quotes/delete"]')
    expect(form).not.toBeNull()
    expect(form.getAttribute('method')).toBe('get')
    expect(
      getByRole(document, 'button', { name: 'Delete selected quotes' })
    ).toBeInTheDocument()
  })

  it('renders no checkboxes or bulk delete form when no quote is eligible', async () => {
    const document = await loadHomePageWithQuotes(ineligibleQuoteFixture)

    expect(document.querySelector('#select-all-quotes')).toBeNull()
    expect(document.querySelectorAll('input[name="references"]')).toHaveLength(
      0
    )
    expect(document.querySelector('form[action="/quotes/delete"]')).toBeNull()
    expect(
      queryByRole(document, 'button', { name: 'Delete selected quotes' })
    ).not.toBeInTheDocument()
  })
})
