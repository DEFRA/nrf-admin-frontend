import { getByLabelText, getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, loadPageWithCookie } from '#/test-utils/load-page.js'
import { getSessionCookie } from '#/test-utils/session-cookie.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  edpWithHistory,
  futureBasePrice,
  pastBasePrice,
  signedInStaff,
  validBasePriceForm
} from '#/test-utils/fixtures/base-prices.js'
import { config } from '#/config/config.js'

const changeUrl = '/base-prices/2/change'
const basePricesEndpoint = `${config.get('impactAssessor.apiUrl')}/base-prices`
const mswServer = setupMswServer()

const stubBasePrices = () =>
  mswServer.use(
    http.get(basePricesEndpoint, () =>
      HttpResponse.json(edpWithHistory(futureBasePrice, pastBasePrice))
    )
  )

describe('Change base price page', () => {
  const getServer = setupTestServer()

  it('fills the form with the saved base price, in UK local time', async () => {
    stubBasePrices()

    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Change the base price'
    )
    expect(getByLabelText(document, 'Base price per unit')).toHaveValue(
      '2800.50'
    )
    expect(getByLabelText(document, 'Day')).toHaveValue('1')
    expect(getByLabelText(document, 'Month')).toHaveValue('3')
    expect(getByLabelText(document, 'Year')).toHaveValue('2099')
    expect(getByLabelText(document, 'Effective from time')).toHaveValue('00:00')
    expect(getByLabelText(document, 'Requestor')).toHaveValue('Grace Hopper')
    expect(getByLabelText(document, 'Jira ticket')).toHaveValue('NRF2-1234')
    expect(getByLabelText(document, 'Comment')).toHaveValue(
      'NE advice after consultation'
    )
  })

  it('sends the user back when the base price has already taken effect', async () => {
    stubBasePrices()

    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/1/change',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-taken-effect'
    )
  })

  it('returns a 404 page for a base price that does not exist', async () => {
    stubBasePrices()

    const response = await getServer().inject({
      method: 'GET',
      url: '/base-prices/99/change',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(404)
  })

  it('saves the change with the signed-in user replacing the saved one', async () => {
    let sent
    let contentType
    mswServer.use(
      http.patch(`${basePricesEndpoint}/2`, async ({ request }) => {
        sent = await request.json()
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ id: 2 })
      })
    )

    const { response } = await submitForm({
      server: getServer(),
      url: changeUrl,
      payload: validBasePriceForm,
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-changed'
    )
    expect(contentType).toBe('application/json')
    expect(sent).toEqual({
      basePrice: 2900.25,
      effectiveFrom: '2099-07-01T08:30:00.000Z',
      requestor: 'Alan Turing',
      jiraTicket: 'NRF2-2000',
      comment: 'Following consultation',
      staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
      staffFullName: 'Ada Admin',
      staffEmail: 'ada.admin@defra.gov.uk'
    })
  })

  it('returns to the form with the problems when the form is invalid', async () => {
    const { response } = await submitForm({
      server: getServer(),
      url: changeUrl,
      payload: { ...validBasePriceForm, effectiveFromTime: '25:00' },
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(changeUrl)
  })

  it('does not carry a rejected change into the add form', async () => {
    const takenEffect = {
      ...futureBasePrice,
      effectiveFrom: '2026-02-01T00:00:00Z'
    }
    mswServer.use(
      http.get(basePricesEndpoint, () =>
        HttpResponse.json(edpWithHistory(takenEffect, pastBasePrice))
      )
    )
    const { cookie } = await submitForm({
      server: getServer(),
      url: changeUrl,
      payload: { ...validBasePriceForm, basePrice: '7777', comment: '' },
      auth: signedInStaff
    })
    const rejected = await getServer().inject({
      method: 'GET',
      url: changeUrl,
      auth: signedInStaff,
      headers: { cookie }
    })

    const { document } = await loadPageWithCookie({
      requestUrl: '/base-prices/add',
      server: getServer(),
      auth: signedInStaff,
      cookie: getSessionCookie(rejected) || cookie
    })

    expect(rejected.headers.location).toBe(
      '/base-prices?notification=base-price-taken-effect'
    )
    expect(getByLabelText(document, /Base price per unit/)).toHaveValue('')
  })

  it.each([
    [409, 'base-price-taken-effect'],
    [404, 'base-price-not-found'],
    [500, 'base-price-error']
  ])(
    'shows a banner when the impact assessor answers %s',
    async (status, notification) => {
      mswServer.use(
        http.patch(
          `${basePricesEndpoint}/2`,
          () => new HttpResponse(null, { status })
        )
      )

      const { response } = await submitForm({
        server: getServer(),
        url: changeUrl,
        payload: validBasePriceForm,
        auth: signedInStaff
      })

      expect(response.headers.location).toBe(
        `/base-prices?notification=${notification}`
      )
    }
  )
})
