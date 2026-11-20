import { getByRole, getByText } from '@testing-library/dom'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { stubInflationIndexes } from '#/test-utils/stub-inflation-indexes.js'
import { loadPage } from '#/test-utils/load-page.js'
import {
  futureIndex,
  liveIndex,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'

const mswServer = setupMswServer()

describe('Inflation index details page', () => {
  const getServer = setupTestServer()

  const loadDetails = (id) =>
    loadPage({
      requestUrl: `/inflation-index/${id}`,
      server: getServer(),
      auth: signedInStaff
    })

  it('shows every field of the inflation index', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadDetails(futureIndex.id)

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Inflation index details'
    )
    const details = document.querySelector('dl')
    expect(details).toHaveTextContent(String(futureIndex.chargingYear))
    expect(details).toHaveTextContent('384.21')
    expect(details).toHaveTextContent('0.9605')
    expect(details).toHaveTextContent('1 January')
    expect(details).toHaveTextContent('1 Nov 2026 at 10:00')
    expect(details).toHaveTextContent('Grace Hopper')
    expect(details).toHaveTextContent('NE advice after consultation')
    expect(details).toHaveTextContent('Ada Admin')
    expect(details).toHaveTextContent('ada.admin@defra.gov.uk')
    expect(details).toHaveTextContent('0b7c1e52-3c1f-4d6a-9d1a-5f2f3e6a7b8c')
    expect(
      getByRole(document, 'link', { name: 'Back to inflation index' })
    ).toHaveAttribute('href', '/inflation-index')
  })

  it('links the Jira ticket to its page in Jira, in a new tab', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadDetails(futureIndex.id)

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

  it('shows a hyphen for an index saved without a requestor or ticket', async () => {
    stubInflationIndexes({
      mswServer,
      inflationIndexes: [futureIndex, liveIndex]
    })

    const document = await loadDetails(liveIndex.id)

    expect(
      getByText(document, 'Requester').nextElementSibling
    ).toHaveTextContent('–')
    expect(
      getByText(document, 'Jira ticket').nextElementSibling
    ).toHaveTextContent('–')
    expect(document.querySelector('dl a')).toBeNull()
  })

  it('returns a 404 page for an inflation index that does not exist', async () => {
    stubInflationIndexes({ mswServer, inflationIndexes: [liveIndex] })

    const response = await getServer().inject({
      method: 'GET',
      url: '/inflation-index/00000000-0000-4000-8000-000000000000',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(404)
  })

  it('returns a 400 page for an id that is not a uuid', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: '/inflation-index/not-a-uuid',
      auth: signedInStaff
    })

    expect(response.statusCode).toBe(400)
  })
})
