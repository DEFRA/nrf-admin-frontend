import { getByRole, getAllByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import {
  inflationIndexesEndpoint,
  stubInflationIndexHistory
} from '#/test-utils/stub-inflation-indexes.js'
import { loadPage } from '#/test-utils/load-page.js'
import {
  earlierAddition,
  laterAddition,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'

const mswServer = setupMswServer()

describe('Inflation index additions page', () => {
  const getServer = setupTestServer()

  const loadHistoryPage = () =>
    loadPage({
      requestUrl: '/inflation-index/history',
      server: getServer(),
      auth: signedInStaff
    })

  it('lists every addition most recent first with its comment and who made it', async () => {
    stubInflationIndexHistory({
      mswServer,
      history: [laterAddition, earlierAddition]
    })

    const document = await loadHistoryPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Inflation index additions'
    )
    const rows = getAllByRole(
      getByRole(document, 'table', { name: 'Additions, most recent first' }),
      'row'
    )
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveTextContent('NE advice after the autumn publication')
    expect(rows[1]).toHaveTextContent('Ada Admin (ada.admin@defra.gov.uk)')
    expect(rows[2]).toHaveTextContent('Following consultation')
    // 18 Nov 2026 at 09:00 — Europe/London rendering of the 09:00Z instant
    expect(rows[1]).toHaveTextContent('18 Nov 2026 at 09:00')
  })

  it('shows the charging year and index value each addition saved', async () => {
    stubInflationIndexHistory({ mswServer, history: [laterAddition] })

    const document = await loadHistoryPage()

    const table = getByRole(document, 'table', {
      name: 'Additions, most recent first'
    })
    expect(
      getAllByRole(table, 'columnheader').map(({ textContent }) =>
        textContent.trim()
      )
    ).toEqual([
      'When',
      'Charging year',
      'RICS CIL Index',
      'Comment',
      'Added by'
    ])
    expect(table).toHaveTextContent(String(laterAddition.chargingYear))
    expect(table).toHaveTextContent('384.21')
  })

  it('says when no indexes have been added', async () => {
    stubInflationIndexHistory({ mswServer, history: [] })

    const document = await loadHistoryPage()

    expect(document.body).toHaveTextContent(
      'No inflation indexes have been added yet.'
    )
    expect(queryByRole(document, 'table')).not.toBeInTheDocument()
  })

  it('links back to the inflation index page', async () => {
    stubInflationIndexHistory({ mswServer, history: [] })

    const document = await loadHistoryPage()

    expect(
      getByRole(document, 'link', { name: 'Back to inflation index' })
    ).toHaveAttribute('href', '/inflation-index')
  })

  it('shows an error when the history cannot be loaded', async () => {
    mswServer.use(
      http.get(
        `${inflationIndexesEndpoint}/history`,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const document = await loadHistoryPage()

    expect(getByRole(document, 'alert')).toHaveTextContent(
      'The additions history could not be loaded'
    )
  })
})
