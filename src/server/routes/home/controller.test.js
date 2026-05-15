import { getByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
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

  const loadHomePage = () => loadPage({ requestUrl: '/', server: getServer() })

  it('renders the page title and heading', async () => {
    mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json([])))

    const document = await loadHomePage()

    expect(document.title).toContain('Home')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Home'
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
    expect(table).toHaveTextContent('NRF-000001')
    expect(table).toHaveTextContent('developer@housebuilder.com')
    expect(table).toHaveTextContent('Great Billing WRC')
    expect(table).toHaveTextContent('Norfolk Fens East')
  })

  it('formats dates in GOV.UK format', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => HttpResponse.json(singleQuoteFixture))
    )

    const document = await loadHomePage()

    const table = getByRole(document, 'table')
    expect(table).toHaveTextContent('23 March 2026')
  })

  it('renders error message when backend call fails', async () => {
    mswServer.use(
      http.get(quotesEndpoint, () => new HttpResponse(null, { status: 500 }))
    )

    const document = await loadHomePage()

    expect(document.body).toHaveTextContent('There is a problem')
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })
})
