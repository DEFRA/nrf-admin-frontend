import { getByRole, getAllByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage } from '#/test-utils/load-page.js'
import {
  futureIndex,
  indexes,
  liveIndex,
  pastIndex,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'
import { config } from '#/config/config.js'

const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer()

const stubInflationIndexes = (...inflationIndexes) =>
  mswServer.use(
    http.get(inflationIndexesEndpoint, () =>
      HttpResponse.json(indexes(...inflationIndexes))
    )
  )

describe('Inflation index page', () => {
  const getServer = setupTestServer()

  const loadInflationIndexPage = (query = '') =>
    loadPage({
      requestUrl: `/inflation-index${query}`,
      server: getServer(),
      auth: signedInStaff
    })

  it('renders the history newest year first with the derived effective date', async () => {
    stubInflationIndexes(futureIndex, liveIndex, pastIndex)

    const document = await loadInflationIndexPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Inflation index'
    )
    const rows = getAllByRole(
      getByRole(document, 'table', { name: 'Inflation index history' }),
      'row'
    )
    expect(rows).toHaveLength(4)
    expect(rows[1]).toHaveTextContent(String(futureIndex.chargingYear))
    expect(rows[1]).toHaveTextContent('384.21')
    expect(rows[1]).toHaveTextContent('0.9605')
    expect(rows[1]).toHaveTextContent('1 January')
    expect(rows[1]).toHaveTextContent('NE advice after consultation')
    expect(rows[1]).toHaveTextContent('Ada Admin')
    expect(rows[1]).toHaveTextContent('ada.admin@defra.gov.uk')
  })

  it('marks the index in force for the current charging year', async () => {
    stubInflationIndexes(liveIndex, pastIndex)

    const document = await loadInflationIndexPage()

    expect(getByRole(document, 'table')).toHaveTextContent('In force')
  })

  it('offers to add an index for a year that does not have one', async () => {
    stubInflationIndexes(liveIndex, pastIndex)

    const document = await loadInflationIndexPage()

    expect(
      getByRole(document, 'link', { name: 'Add inflation index' })
    ).toHaveAttribute('href', '/inflation-index/add')
  })

  it('offers to change or delete only an index whose year has not begun', async () => {
    stubInflationIndexes(futureIndex, liveIndex, pastIndex)

    const document = await loadInflationIndexPage()

    expect(getByRole(document, 'link', { name: /^Change/ })).toHaveAttribute(
      'href',
      `/inflation-index/${futureIndex.id}/change`
    )
    expect(getByRole(document, 'link', { name: /^Delete/ })).toHaveAttribute(
      'href',
      `/inflation-index/${futureIndex.id}/delete`
    )
    expect(document.querySelectorAll('a[href*="/change"]').length).toBe(1)
    expect(document.querySelectorAll('a[href*="/delete"]').length).toBe(1)
  })

  it('says when no inflation indexes exist', async () => {
    stubInflationIndexes()

    const document = await loadInflationIndexPage()

    expect(document.body).toHaveTextContent(
      'No inflation indexes have been added.'
    )
  })

  it.each([
    ['inflation-index-added', 'Inflation index added.'],
    ['inflation-index-changed', 'Inflation index changed.'],
    ['inflation-index-deleted', 'Inflation index deleted.'],
    ['inflation-index-year-exists', 'that year already has one'],
    ['inflation-index-taken-effect', 'the year has already begun'],
    ['inflation-index-in-use', 'used to price a quote'],
    ['inflation-index-not-found', 'no longer exists'],
    ['inflation-index-error', 'The inflation index was not saved']
  ])('shows the banner for %s', async (notification, text) => {
    stubInflationIndexes(liveIndex)

    const document = await loadInflationIndexPage(
      `?notification=${notification}`
    )

    expect(document.body).toHaveTextContent(text)
  })

  it('shows an error when the inflation indexes cannot be loaded', async () => {
    mswServer.use(
      http.get(
        inflationIndexesEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const document = await loadInflationIndexPage()

    expect(getByRole(document, 'alert')).toHaveTextContent(
      'Inflation indexes could not be loaded'
    )
  })

  it('rejects a notification it does not recognise', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/inflation-index?notification=<script>',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(400)
  })
})
