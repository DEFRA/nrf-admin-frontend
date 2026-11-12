import { getByRole, getAllByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import {
  edpWithHistory,
  futureBasePrice,
  pastBasePrice,
  signedInStaff
} from '#/test-utils/fixtures/base-prices.js'
import { config } from '#/config/config.js'

const basePricesEndpoint = `${config.get('impactAssessor.apiUrl')}/base-prices`
const mswServer = setupMswServer()

const stubBasePrices = (edps) =>
  mswServer.use(http.get(basePricesEndpoint, () => HttpResponse.json(edps)))

describe('Base prices page', () => {
  const getServer = setupTestServer()

  const loadBasePricesPage = (query = '') =>
    loadPage({
      requestUrl: `/base-prices${query}`,
      server: getServer(),
      auth: signedInStaff
    })

  it('renders the history of each EDP with dates in UK local time', async () => {
    stubBasePrices(
      edpWithHistory(
        { ...futureBasePrice, effectiveFrom: '2099-07-01T08:30:00Z' },
        pastBasePrice
      )
    )

    const document = await loadBasePricesPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Base prices'
    )
    expect(
      getByRole(document, 'heading', { name: 'Test nutrient EDP' })
    ).toBeInTheDocument()
    const rows = getAllByRole(
      getByRole(document, 'table', {
        name: 'Base price history for Test nutrient EDP'
      }),
      'row'
    )
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveTextContent('£2,800.50')
    expect(rows[1]).toHaveTextContent('1 Jul 2099 at 09:30')
    expect(rows[1]).toHaveTextContent('NE advice after consultation')
    expect(rows[1]).toHaveTextContent('Ada Admin')
    expect(rows[1]).toHaveTextContent('ada.admin@defra.gov.uk')
    expect(rows[2]).toHaveTextContent('£2,675.00')
    expect(rows[2]).toHaveTextContent('1 Jan 2026 at 00:00')
  })

  it('offers to add a base price when none is waiting to take effect', async () => {
    stubBasePrices(edpWithHistory(pastBasePrice))

    const document = await loadBasePricesPage()

    expect(
      getByRole(document, 'button', { name: 'Add base price' })
    ).toHaveAttribute('href', '/base-prices/add')
    expect(
      queryByRole(document, 'link', { name: /^Change/ })
    ).not.toBeInTheDocument()
    expect(
      queryByRole(document, 'link', { name: /^Delete/ })
    ).not.toBeInTheDocument()
  })

  it('offers to change or delete only a base price waiting to take effect', async () => {
    stubBasePrices(edpWithHistory(futureBasePrice, pastBasePrice))

    const document = await loadBasePricesPage()

    expect(
      queryByRole(document, 'button', { name: 'Add base price' })
    ).not.toBeInTheDocument()
    expect(getByRole(document, 'link', { name: /^Change/ })).toHaveAttribute(
      'href',
      '/base-prices/2/change'
    )
    expect(getByRole(document, 'link', { name: /^Delete/ })).toHaveAttribute(
      'href',
      '/base-prices/2/delete'
    )
  })

  it('says when an EDP has no base prices', async () => {
    stubBasePrices(edpWithHistory())

    const document = await loadBasePricesPage()

    expect(document.body).toHaveTextContent('This EDP has no base prices.')
  })

  it.each([
    ['base-price-added', 'Base price added.'],
    ['base-price-changed', 'Base price changed.'],
    ['base-price-deleted', 'Base price deleted.'],
    ['base-price-future-exists', 'there is already a base price'],
    ['base-price-taken-effect', 'it has already taken effect'],
    ['base-price-error', 'The base price was not saved']
  ])('shows the banner for %s', async (notification, text) => {
    stubBasePrices(edpWithHistory(pastBasePrice))

    const document = await loadBasePricesPage(`?notification=${notification}`)

    expect(document.body).toHaveTextContent(text)
  })

  it('shows an error when the base prices cannot be loaded', async () => {
    mswServer.use(
      http.get(
        basePricesEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const document = await loadBasePricesPage()

    expect(getByRole(document, 'alert')).toHaveTextContent(
      'Base prices could not be loaded'
    )
  })

  it('rejects a notification it does not recognise', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices?notification=<script>',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(400)
  })
})
