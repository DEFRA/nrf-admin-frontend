import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  edpWithHistory,
  futureBasePrice,
  pastBasePrice,
  signedInStaff
} from '#/test-utils/fixtures/base-prices.js'
import { config } from '#/config/config.js'

const deleteUrl = '/base-prices/2/delete'
const basePricesEndpoint = `${config.get('impactAssessor.apiUrl')}/base-prices`
const mswServer = setupMswServer()

const stubBasePrices = () =>
  mswServer.use(
    http.get(basePricesEndpoint, () =>
      HttpResponse.json(edpWithHistory(futureBasePrice, pastBasePrice))
    )
  )

describe('Delete base price page', () => {
  const getServer = setupTestServer()

  it('asks the user to confirm, showing the base price', async () => {
    stubBasePrices()

    const document = await loadPage({
      requestUrl: deleteUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Delete this base price?'
    )
    expect(document.body).toHaveTextContent('£2,800.50')
    expect(document.body).toHaveTextContent('1 Mar 2099 at 00:00')
    expect(document.body).toHaveTextContent('NE advice after consultation')
    expect(
      getByRole(document, 'button', { name: 'Yes, delete this base price' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/base-prices'
    )
    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('sends the user back when the base price has already taken effect', async () => {
    stubBasePrices()

    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/1/delete',
      auth: signedInStaff
    })

    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-taken-effect'
    )
  })

  it('returns a 404 page for a base price that does not exist', async () => {
    stubBasePrices()

    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/99/delete',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(404)
  })

  it('deletes the base price and confirms it', async () => {
    mswServer.use(
      http.delete(
        `${basePricesEndpoint}/2`,
        () => new HttpResponse(null, { status: 204 })
      )
    )

    const { response } = await submitForm({
      server: getServer(),
      url: deleteUrl,
      payload: {},
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-deleted'
    )
  })

  it.each([
    [409, 'base-price-taken-effect'],
    [404, 'base-price-not-found'],
    [500, 'base-price-error']
  ])(
    'shows a banner when the impact assessor answers %s',
    async (status, notification) => {
      mswServer.use(
        http.delete(
          `${basePricesEndpoint}/2`,
          () => new HttpResponse(null, { status })
        )
      )

      const { response } = await submitForm({
        server: getServer(),
        url: deleteUrl,
        payload: {},
        auth: signedInStaff
      })

      expect(response.headers.location).toBe(
        `/base-prices?notification=${notification}`
      )
    }
  )
})
