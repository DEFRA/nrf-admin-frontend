import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  edpWithHistory,
  futureBasePrice,
  pastBasePrice,
  signedInStaff,
  validBasePriceForm
} from '#/test-utils/fixtures/base-prices.js'
import { config } from '#/config/config.js'

const addUrl = '/base-prices/add'
const basePricesEndpoint = `${config.get('impactAssessor.apiUrl')}/base-prices`
const mswServer = setupMswServer()

const stubBasePrices = (...basePrices) =>
  mswServer.use(
    http.get(basePricesEndpoint, () =>
      HttpResponse.json(edpWithHistory(...basePrices))
    )
  )

describe('Add base price page', () => {
  const getServer = setupTestServer()

  const submitAddForm = (payload, cookie) =>
    submitForm({
      server: getServer(),
      url: addUrl,
      payload,
      auth: signedInStaff,
      cookie
    })

  it('shows the EDP and the signed-in user, who cannot be changed', async () => {
    stubBasePrices(pastBasePrice)

    const document = await loadPage({
      requestUrl: addUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Add a base price'
    )
    expect(document.body).toHaveTextContent('Test nutrient EDP')
    expect(document.body).toHaveTextContent('Ada Admin')
    expect(document.body).toHaveTextContent('ada.admin@defra.gov.uk')
    expect(getByLabelText(document, 'Effective from time')).toHaveValue('00:00')
  })

  it('sends the user to the base prices page when one is already waiting to take effect', async () => {
    stubBasePrices(futureBasePrice, pastBasePrice)

    const response = await getServer().inject({
      method: 'GET',
      url: addUrl,
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-future-exists'
    )
  })

  it('adds the base price with the date in UTC and the user from the session', async () => {
    stubBasePrices(pastBasePrice)
    let sent
    let contentType
    mswServer.use(
      http.post(basePricesEndpoint, async ({ request }) => {
        sent = await request.json()
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ id: 3 }, { status: 201 })
      })
    )

    const { response } = await submitAddForm(validBasePriceForm)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-added'
    )
    expect(contentType).toBe('application/json')
    expect(sent).toEqual({
      edpId: 1,
      basePrice: 2900.25,
      effectiveFrom: '2099-07-01T08:30:00.000Z',
      comment: 'Following consultation',
      staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
      staffFullName: 'Ada Admin',
      staffEmail: 'ada.admin@defra.gov.uk'
    })
  })

  it('does not accept user details from the form', async () => {
    const { response } = await submitAddForm({
      ...validBasePriceForm,
      staffEmail: 'someone.else@example.com'
    })

    expect(response.statusCode).toBe(400)
  })

  it('shows every problem with the form and keeps what was entered', async () => {
    const { response, cookie } = await submitAddForm({
      ...validBasePriceForm,
      basePrice: '12.345',
      'effectiveFrom-year': '2020',
      comment: ''
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(addUrl)

    stubBasePrices(pastBasePrice)
    const document = await loadPage({
      requestUrl: addUrl,
      server: getServer(),
      auth: signedInStaff,
      cookie
    })

    const summary = getByRole(document, 'alert')
    expect(summary).toHaveTextContent('There is a problem')
    expect(
      getByText(summary, 'Enter a valid base price', { exact: false })
    ).toBeInTheDocument()
    expect(
      getByText(summary, 'The date and time must be in the future')
    ).toBeInTheDocument()
    expect(getByText(summary, 'Enter a comment')).toBeInTheDocument()
    expect(getByLabelText(document, 'Base price per unit')).toHaveValue(
      '12.345'
    )
    expect(getByLabelText(document, 'Effective from time')).toHaveValue('09:30')
  })

  it('shows the problems once, then the form as new', async () => {
    const { cookie } = await submitAddForm({
      ...validBasePriceForm,
      comment: ''
    })
    stubBasePrices(pastBasePrice)

    const first = await getServer().inject({
      method: 'GET',
      url: addUrl,
      auth: signedInStaff,
      headers: { cookie }
    })
    const cookieAfterFirst = first.headers['set-cookie']
      ?.map((header) => header.split(';')[0])
      .join('; ')
    const second = await getServer().inject({
      method: 'GET',
      url: addUrl,
      auth: signedInStaff,
      headers: { cookie: cookieAfterFirst ?? cookie }
    })

    expect(new JSDOM(first.result).window.document.body).toHaveTextContent(
      'Enter a comment'
    )
    expect(new JSDOM(second.result).window.document.body).not.toHaveTextContent(
      'Enter a comment'
    )
  })

  it('tells the user when a base price was added by someone else in the meantime', async () => {
    mswServer.use(
      http.post(basePricesEndpoint, () =>
        HttpResponse.json({ detail: 'already has one' }, { status: 409 })
      )
    )

    const { response } = await submitAddForm(validBasePriceForm)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-future-exists'
    )
  })

  it('reports any other failure from the impact assessor', async () => {
    mswServer.use(
      http.post(
        basePricesEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const { response } = await submitAddForm(validBasePriceForm)

    expect(response.headers.location).toBe(
      '/base-prices?notification=base-price-error'
    )
  })
})
