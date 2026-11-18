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
  addedHistory,
  amendedHistory,
  deletedHistory,
  signedInStaff
} from '#/test-utils/fixtures/inflation-index.js'

const mswServer = setupMswServer()

describe('Inflation index change history page', () => {
  const getServer = setupTestServer()

  const loadHistoryPage = () =>
    loadPage({
      requestUrl: '/inflation-index/history',
      server: getServer(),
      auth: signedInStaff
    })

  it('lists every change most recent first with its comment and who made it', async () => {
    stubInflationIndexHistory({
      mswServer,
      history: [deletedHistory, amendedHistory, addedHistory]
    })

    const document = await loadHistoryPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Inflation index change history'
    )
    const rows = getAllByRole(
      getByRole(document, 'table', { name: 'Changes, most recent first' }),
      'row'
    )
    expect(rows).toHaveLength(4)
    expect(rows[1]).toHaveTextContent('Deleted')
    expect(rows[1]).toHaveTextContent('Withdrawn after review')
    expect(rows[1]).toHaveTextContent('Dee Admin (dee.admin@defra.gov.uk)')
    expect(rows[2]).toHaveTextContent('Amended')
    expect(rows[2]).toHaveTextContent('Revised after checking')
    expect(rows[3]).toHaveTextContent('Added')
    expect(rows[3]).toHaveTextContent('Following consultation')
    // 18 Nov 2026 at 09:00 — Europe/London rendering of the 09:00Z instant
    expect(rows[1]).toHaveTextContent('18 Nov 2026 at 09:00')
  })

  it('shows the charging year and index value each change saved', async () => {
    stubInflationIndexHistory({
      mswServer,
      history: [amendedHistory]
    })

    const document = await loadHistoryPage()

    const table = getByRole(document, 'table', {
      name: 'Changes, most recent first'
    })
    expect(
      getAllByRole(table, 'columnheader').map(({ textContent }) =>
        textContent.trim()
      )
    ).toEqual([
      'When',
      'Action',
      'Charging year',
      'RICS CIL Index',
      'Comment',
      'Saved by'
    ])
    expect(table).toHaveTextContent(String(amendedHistory.chargingYear))
    expect(table).toHaveTextContent('384.21')
  })

  it('says when no changes have been recorded', async () => {
    stubInflationIndexHistory({ mswServer, history: [] })

    const document = await loadHistoryPage()

    expect(document.body).toHaveTextContent(
      'No changes have been recorded yet.'
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
      'The change history could not be loaded'
    )
  })
})
