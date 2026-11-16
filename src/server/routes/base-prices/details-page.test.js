import { getByRole, getByText } from '@testing-library/dom'
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

describe('Base price details page', () => {
  const getServer = setupTestServer()

  const stubBasePrices = (...basePrices) =>
    mswServer.use(
      http.get(basePricesEndpoint, () =>
        HttpResponse.json(edpWithHistory(...basePrices))
      )
    )

  const loadDetails = (id) =>
    loadPage({
      requestUrl: `/base-prices/${id}`,
      server: getServer(),
      auth: signedInStaff
    })

  it('shows every field of the base price, with dates in UK local time', async () => {
    stubBasePrices(futureBasePrice, pastBasePrice)

    const document = await loadDetails(2)

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Base price details'
    )
    const details = document.querySelector('dl')
    expect(details).toHaveTextContent('Test nutrient EDP')
    expect(details).toHaveTextContent('£2,800.50')
    expect(details).toHaveTextContent('1 Mar 2099 at 00:00')
    expect(details).toHaveTextContent('1 Nov 2026 at 10:00')
    expect(details).toHaveTextContent('Grace Hopper')
    expect(details).toHaveTextContent('NE advice after consultation')
    expect(details).toHaveTextContent('Ada Admin')
    expect(details).toHaveTextContent('ada.admin@defra.gov.uk')
    expect(details).toHaveTextContent('0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c')
    expect(
      getByRole(document, 'link', { name: 'Back to base prices' })
    ).toHaveAttribute('href', '/base-prices')
  })

  it('links the Jira ticket to its page in Jira, in a new tab', async () => {
    stubBasePrices(futureBasePrice, pastBasePrice)

    const document = await loadDetails(2)

    const link = getByRole(document, 'link', {
      name: 'NRF2-1234 (opens in new tab)'
    })
    expect(link).toHaveAttribute(
      'href',
      'https://eaflood.atlassian.net/browse/NRF2-1234'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows a hyphen for a base price saved without a requestor or ticket', async () => {
    stubBasePrices(futureBasePrice, pastBasePrice)

    const document = await loadDetails(1)

    expect(
      getByText(document, 'Requestor').nextElementSibling
    ).toHaveTextContent('–')
    expect(
      getByText(document, 'Jira ticket').nextElementSibling
    ).toHaveTextContent('–')
    expect(document.querySelector('dl a')).toBeNull()
  })

  it('returns a 404 page for a base price that does not exist', async () => {
    stubBasePrices(pastBasePrice)

    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/99',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(404)
  })

  it('returns a 400 page for an id that is not a number', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/abc',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(400)
  })
})
