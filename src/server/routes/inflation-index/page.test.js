import { getByRole, getAllByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import {
  inflationIndexesEndpoint,
  stubInflationIndexes
} from '#/test-utils/stub-inflation-indexes.js'
import { loadPage } from '#/test-utils/load-page.js'
import {
  futureIndex,
  liveIndex,
  pastIndex,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'

const mswServer = setupMswServer()

describe('Inflation index page', () => {
  const getServer = setupTestServer()

  const loadInflationIndexPage = (query = '') =>
    loadPage({
      requestUrl: `/inflation-index${query}`,
      server: getServer(),
      auth: signedInStaff
    })

  it('renders the history newest year first with the derived effective date', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex, pastIndex]
    })

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
    expect(rows[1]).not.toHaveTextContent('NE advice after consultation')
    expect(rows[1]).not.toHaveTextContent('Ada Admin')
    expect(rows[1]).not.toHaveTextContent('ada.admin@defra.gov.uk')
  })

  it("lists only the year, index and factor columns, with a link to each index's details", async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadInflationIndexPage()

    const table = getByRole(document, 'table', {
      name: 'Inflation index history'
    })
    expect(
      getAllByRole(table, 'columnheader').map(({ textContent }) =>
        textContent.trim()
      )
    ).toEqual(['Charging year', 'RICS CIL Index', 'Factor', 'Actions'])
    const detailsLinks = getAllByRole(table, 'link', { name: /^View details/ })
    expect(detailsLinks.map((link) => link.getAttribute('href'))).toEqual([
      `/inflation-index/${futureIndex.id}`,
      `/inflation-index/${liveIndex.id}`
    ])
  })

  it('marks the index in force for the current charging year', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [liveIndex, pastIndex]
    })

    const document = await loadInflationIndexPage()

    expect(getByRole(document, 'table')).toHaveTextContent('In force')
  })

  it('links to the additions history', async () => {
    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })

    const document = await loadInflationIndexPage()

    expect(
      getByRole(document, 'link', { name: 'View added inflation indexes' })
    ).toHaveAttribute('href', '/inflation-index/history')
  })

  it('offers to add an index for a year that does not have one', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [liveIndex, pastIndex]
    })

    const document = await loadInflationIndexPage()

    expect(
      getByRole(document, 'button', { name: 'Add inflation index' })
    ).toHaveAttribute('href', '/inflation-index/add')
  })

  it('offers to change or delete only an index whose year has not begun', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex, pastIndex]
    })

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

  it('hides the add button when every offered year already has an index', async () => {
    const everyYearTaken = [
      liveIndex,
      ...Array.from({ length: 10 }, (_, offset) => ({
        ...pastIndex,
        id: `00000000-0000-4000-8000-${String(offset).padStart(12, '0')}`,
        chargingYear: new Date().getUTCFullYear() + offset + 1
      }))
    ]
    stubInflationIndexes({ mswServer, inflationIndexes: everyYearTaken })

    const document = await loadInflationIndexPage()

    expect(
      queryByRole(document, 'button', { name: 'Add inflation index' })
    ).not.toBeInTheDocument()
  })

  it('says when no inflation indexes exist', async () => {
    stubInflationIndexes({ mswServer, inflationIndexes: [] })

    const document = await loadInflationIndexPage()

    expect(document.body).toHaveTextContent(
      'No inflation indexes have been added.'
    )
  })

  it.each([
    ['inflation-index-added', 'Inflation index added.'],
    ['inflation-index-changed', 'Inflation index changed.'],
    ['inflation-index-deleted', 'Inflation index deleted.'],
    ['inflation-index-year-exists', 'one already exists'],
    ['inflation-index-all-years-taken', 'every year already has one'],
    ['inflation-index-taken-effect', 'before its charging year begins'],
    ['inflation-index-in-use', 'used to price a quote'],
    ['inflation-index-not-found', 'no longer exists'],
    ['inflation-index-error', 'The inflation index was not saved']
  ])('shows the banner for %s', async (notification, text) => {
    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })

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
