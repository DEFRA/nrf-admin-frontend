import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, loadPageWithCookie } from '#/test-utils/load-page.js'
import { submitForm } from '#/test-utils/submit-form.js'
import {
  futureIndex,
  indexes,
  liveIndex,
  pastIndex,
  signedInStaff,
  validAddForm
} from '#/test-utils/fixtures/inflation-index.js'
import { config } from '#/config/config.js'

const addUrl = '/inflation-index/add'
const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer()

const stubInflationIndexes = (...inflationIndexes) =>
  mswServer.use(
    http.get(inflationIndexesEndpoint, () =>
      HttpResponse.json(indexes(...inflationIndexes))
    )
  )

describe('Add inflation index page', () => {
  const getServer = setupTestServer()

  const submitAddForm = (payload, cookie) =>
    submitForm({
      server: getServer(),
      url: addUrl,
      payload,
      auth: signedInStaff,
      cookie
    })

  it('offers only future years that do not already have an index', async () => {
    stubInflationIndexes(futureIndex, liveIndex, pastIndex)

    const document = await loadPage({
      requestUrl: addUrl,
      server: getServer(),
      auth: signedInStaff
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Add an inflation index'
    )
    const options = Array.from(
      getByLabelText(document, 'Charging year').querySelectorAll('option')
    )
    const offered = options
      .filter((option) => option.value)
      .map((option) => Number(option.value))
    expect(offered).not.toContain(liveIndex.chargingYear)
    expect(offered).not.toContain(futureIndex.chargingYear)
    expect(offered[0]).toBe(liveIndex.chargingYear + 1)
    expect(document.body).toHaveTextContent('Ada Admin')
    expect(document.body).toHaveTextContent('ada.admin@defra.gov.uk')
    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('sends the user to the inflation index page when every offered year is taken', async () => {
    const currentYear = liveIndex.chargingYear
    stubInflationIndexes(
      ...Array.from({ length: 10 }, (_, offset) => ({
        ...futureIndex,
        chargingYear: currentYear + 1 + offset
      }))
    )

    const response = await getServer().inject({
      method: 'GET',
      url: addUrl,
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-year-exists'
    )
  })

  it('adds the index with the user from the session', async () => {
    stubInflationIndexes(liveIndex)
    let sent
    let contentType
    mswServer.use(
      http.post(inflationIndexesEndpoint, async ({ request }) => {
        sent = await request.json()
        contentType = request.headers.get('content-type')
        return HttpResponse.json({ id: 'new-id' }, { status: 201 })
      })
    )

    const { response } = await submitAddForm(validAddForm)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-added'
    )
    expect(contentType).toBe('application/json')
    expect(sent).toEqual({
      chargingYear: Number(validAddForm.chargingYear),
      cilIndex: 384.21,
      comment: 'Following consultation',
      staffId: '0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c',
      staffFullName: 'Ada Admin',
      staffEmail: 'ada.admin@defra.gov.uk'
    })
  })

  it('does not accept user details from the form', async () => {
    const { response } = await submitAddForm({
      ...validAddForm,
      staffEmail: 'someone.else@example.com'
    })

    expect(response.statusCode).toBe(400)
  })

  it('shows every problem with the form and keeps what was entered', async () => {
    const { response, cookie } = await submitAddForm({
      ...validAddForm,
      chargingYear: '',
      cilIndex: '384.21315',
      comment: ''
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(addUrl)

    stubInflationIndexes(liveIndex)
    const document = await loadPage({
      requestUrl: addUrl,
      server: getServer(),
      auth: signedInStaff,
      cookie
    })

    const summary = getByRole(document, 'alert')
    expect(summary).toHaveTextContent('There is a problem')
    expect(
      getByText(summary, 'Select the year the inflation index applies to')
    ).toBeInTheDocument()
    expect(
      getByText(summary, 'Enter a valid RICS CIL Index', { exact: false })
    ).toBeInTheDocument()
    expect(getByText(summary, 'Enter a comment')).toBeInTheDocument()
    expect(getByLabelText(document, 'RICS CIL Index')).toHaveValue('384.21315')
  })

  it('shows the problems once, then the form as new', async () => {
    const { cookie } = await submitAddForm({ ...validAddForm, comment: '' })
    stubInflationIndexes(liveIndex)
    const pageOptions = {
      requestUrl: addUrl,
      server: getServer(),
      auth: signedInStaff
    }

    const first = await loadPageWithCookie({ ...pageOptions, cookie })
    const second = await loadPageWithCookie({
      ...pageOptions,
      cookie: first.cookie
    })

    expect(first.document.body).toHaveTextContent('Enter a comment')
    expect(second.document.body).not.toHaveTextContent('Enter a comment')
  })

  it('tells the user when the year was taken by someone else in the meantime', async () => {
    mswServer.use(
      http.post(inflationIndexesEndpoint, () =>
        HttpResponse.json({ detail: 'already exists' }, { status: 409 })
      )
    )

    const { response } = await submitAddForm(validAddForm)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-year-exists'
    )
  })

  it('reports any other failure from the impact assessor', async () => {
    mswServer.use(
      http.post(
        inflationIndexesEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const { response } = await submitAddForm(validAddForm)

    expect(response.headers.location).toBe(
      '/inflation-index?notification=inflation-index-error'
    )
  })
})
