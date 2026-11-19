import {
  getAllByRole,
  getByRole,
  queryByRole,
  queryByText,
  within
} from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  multipleQuotesFixture,
  quoteWithLevyHistoryFixture,
  ineligibleQuoteFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

// Run as production with an approved address list so the ineligible fixture
// (created with an external address) is genuinely refused
vi.mock('#/config/config.js', async (importOriginal) => {
  const { config } = await importOriginal()
  const { productionDeleteEligibilityConfig } =
    await import('#/test-utils/production-delete-eligibility.js')
  return productionDeleteEligibilityConfig(config)
})

const backendUrl = config.get('backend.apiUrl')
const quotesEndpoint = `${backendUrl}/quotes`

const mswServer = setupMswServer()

const stubQuotesResponse = (quotes) =>
  mswServer.use(http.get(quotesEndpoint, () => HttpResponse.json(quotes)))

describe('Quote page', () => {
  const getServer = setupTestServer()

  const loadQuotePage = (reference = 'NRL-000001') =>
    loadPage({
      requestUrl: `/quote/${reference}`,
      server: getServer(),
      auth: authenticatedRequest
    })

  const loadQuotePageWithQuotes = async (quotes, reference) => {
    stubQuotesResponse(quotes)
    return loadQuotePage(reference)
  }

  it('renders the page title and heading', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(document.title).toContain('Quote NRL-000001')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Quote NRL-000001'
    )
  })

  it('shows when the commitment certificate was created', async () => {
    const document = await loadQuotePageWithQuotes([
      {
        ...singleQuoteFixture[0],
        commitmentCertificateCreatedAt: '2026-01-02T14:30:00.000Z'
      }
    ])

    expect(document.body).toHaveTextContent('Commitment certificate created at')
    expect(document.body).toHaveTextContent('2 Jan 2026 at 14:30')
  })

  it('shows Not created when no commitment certificate has been created', async () => {
    const document = await loadQuotePageWithQuotes([
      { ...singleQuoteFixture[0], commitmentCertificateCreatedAt: null }
    ])

    expect(document.body).toHaveTextContent(
      'Commitment certificate created at Not created'
    )
  })

  it('renders a back link to the quotes list', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      getByRole(document, 'link', { name: 'Back to quotes' })
    ).toHaveAttribute('href', '/')
  })

  it('shows the quote created date, planning type and commitment certificate in the details and dates tab', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    const panel = within(document.getElementById('details-and-dates'))
    expect(panel.getByText('Quote created')).toBeInTheDocument()
    expect(document.body).toHaveTextContent('23 Mar 2026 at 00:00')
    expect(document.body).toHaveTextContent('full-planning-permission')
    expect(document.body).toHaveTextContent('Commitment certificate created at')
    expect(queryByText(document, 'Date submitted')).not.toBeInTheDocument()
  })

  it('shows how a drawn boundary was entered in the details and dates tab', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      within(document.getElementById('details-and-dates')).getByText(
        'Boundary type'
      )
    ).toBeInTheDocument()
    expect(document.getElementById('details-and-dates')).toHaveTextContent(
      'Boundary type draw'
    )
  })

  it('shows the file name beside an uploaded boundary', async () => {
    const document = await loadQuotePageWithQuotes(
      multipleQuotesFixture,
      'NRL-000002'
    )

    expect(document.getElementById('details-and-dates')).toHaveTextContent(
      'Boundary type upload (boundary.shp)'
    )
  })

  it('does not summarise the levy totals above the history table', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      queryByText(document, 'Total rounded levy amount')
    ).not.toBeInTheDocument()
    expect(
      queryByText(document, 'Total inflation adjusted levy amount')
    ).not.toBeInTheDocument()
  })

  it('shows whole pound levy amounts without the pence', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    const table = getByRole(document, 'table', {
      name: 'Levy calculation history'
    })

    expect(table).toHaveTextContent('£999')
    expect(document.body).not.toHaveTextContent('£999.00')
  })

  it('renders the levy calculation history in the levy tab', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      within(document.getElementById('quote')).getByRole('table', {
        name: 'Levy calculation history'
      })
    ).toBeInTheDocument()
  })

  describe('tabs', () => {
    it('offers the details and dates, levy, emails sent and EDPs tabs, with details and dates first', async () => {
      const document = await loadQuotePageWithQuotes(singleQuoteFixture)

      const tabs = getAllByRole(document, 'link').filter((link) =>
        link.classList.contains('govuk-tabs__tab')
      )
      expect(tabs.map((tab) => tab.textContent.trim())).toEqual([
        'Details & dates',
        'Levy',
        'Emails sent',
        'EDPs'
      ])
      expect(tabs[0]).toHaveAttribute('href', '#details-and-dates')
    })

    it('lists the emails in a table in the emails sent tab', async () => {
      const document = await loadQuotePageWithQuotes(singleQuoteFixture)

      const table = within(document.getElementById('emails-sent')).getByRole(
        'table',
        { name: 'Emails sent to user' }
      )
      expect(
        within(table).getByRole('columnheader', { name: 'Email type' })
      ).toBeInTheDocument()
      expect(table).toHaveTextContent('quote_results')
      expect(table).toHaveTextContent('Delivered')
    })

    it('lists each EDP and its catchments in the EDPs tab', async () => {
      const document = await loadQuotePageWithQuotes(singleQuoteFixture)

      const panel = within(document.getElementById('edps'))
      expect(
        panel.getByRole('heading', { name: 'Norfolk Fens East' })
      ).toBeInTheDocument()
      expect(
        panel.getByText('EDP start date: 1 January 2026')
      ).toBeInTheDocument()
      expect(panel.getByText('Broads SAC — 67.4% overlap')).toBeInTheDocument()
      expect(
        panel.getByText('River Wensum SAC — 32.6% overlap')
      ).toBeInTheDocument()
    })

    it('keeps the levy history out of the EDPs tab', async () => {
      const document = await loadQuotePageWithQuotes(singleQuoteFixture)

      expect(
        within(document.getElementById('edps')).queryByRole('table')
      ).not.toBeInTheDocument()
    })
  })

  describe('levy calculation history', () => {
    const loadHistoryRows = async (quote) => {
      const document = await loadQuotePageWithQuotes([quote])
      const table = getByRole(document, 'table', {
        name: 'Levy calculation history'
      })
      return { table, rows: getAllByRole(table, 'row').slice(1) }
    }

    it('shows every data point of each calculation in a single table', async () => {
      const { table } = await loadHistoryRows(quoteWithLevyHistoryFixture)

      for (const heading of [
        'Calculated',
        'Journey',
        'Units',
        'Original base charge per unit',
        'Base charge per unit',
        'Original base amount',
        'Provisional amount',
        'Inflation adjusted amount',
        'Model version'
      ]) {
        expect(
          getByRole(table, 'columnheader', { name: heading })
        ).toBeInTheDocument()
      }
    })

    it('lists the most recent calculation first', async () => {
      const { rows } = await loadHistoryRows(quoteWithLevyHistoryFixture)

      expect(rows).toHaveLength(2)
      expect(rows[0]).toHaveTextContent('17 Nov 2026 at 12:00')
      expect(rows[0]).toHaveTextContent('Request to use journey')
      expect(rows[0]).toHaveTextContent('£3,000.00')
      expect(rows[0]).toHaveTextContent('£2,500.00')
      expect(rows[0]).toHaveTextContent('£25,000')
      expect(rows[0]).toHaveTextContent('£30,000')
      expect(rows[0]).toHaveTextContent('£31,000')
      expect(rows[1]).toHaveTextContent('14 Sep 2026 at 10:30')
      expect(rows[1]).toHaveTextContent('Quote journey')
      expect(rows[1]).toHaveTextContent('£2,675.00')
    })

    it('shows the model version of each calculation', async () => {
      const { rows } = await loadHistoryRows(quoteWithLevyHistoryFixture)

      expect(rows[0]).toHaveTextContent(/2$/)
      expect(rows[1]).toHaveTextContent(/1$/)
    })

    it('shows a single row for a first calculation', async () => {
      const { rows } = await loadHistoryRows(singleQuoteFixture[0])

      expect(rows).toHaveLength(1)
    })
  })

  it('renders a delete button for a quote eligible for deletion', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      getByRole(document, 'button', { name: 'Delete quote' })
    ).toHaveAttribute('href', '/quote/NRL-000001/delete')
  })

  it('explains why an ineligible quote cannot be deleted', async () => {
    const document = await loadQuotePageWithQuotes(
      ineligibleQuoteFixture,
      'NRL-000003'
    )

    expect(
      queryByRole(document, 'button', { name: 'Delete quote' })
    ).not.toBeInTheDocument()
    expect(document.body).toHaveTextContent(
      'This quote cannot be deleted because it was not created with an approved internal email address.'
    )
  })

  it('renders the email delivery section with type, status, retry count, send date and Notify link', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(document.body).toHaveTextContent('Emails sent to user')
    expect(document.body).toHaveTextContent('Email type')
    expect(document.body).toHaveTextContent('quote_results')
    expect(document.body).not.toHaveTextContent('Notification ID')
    expect(document.body).toHaveTextContent('Notify send status')
    expect(document.body).toHaveTextContent('Delivered')
    expect(document.body).toHaveTextContent('Retry count')
    expect(document.body).toHaveTextContent('0')
    expect(document.body).toHaveTextContent('Send requested')
    const viewEmailLink = document.body.querySelector(
      'a[href*="notifications.service.gov.uk/services"]'
    )
    expect(viewEmailLink).toBeInTheDocument()
    expect(viewEmailLink).toHaveTextContent('(view email)')
  })

  it('shows a hyphen for notify send status when no notification id (Notify rejected the send)', async () => {
    const quoteWithNoNotifyId = [
      {
        ...singleQuoteFixture[0],
        emailNotifications: [
          {
            ...singleQuoteFixture[0].emailNotifications[0],
            notifySendStatus: null,
            sendRetryCount: 1,
            notificationId: null,
            notifyStatusUrl: null
          }
        ]
      }
    ]
    const document = await loadQuotePageWithQuotes(quoteWithNoNotifyId)

    expect(document.body).not.toHaveTextContent('Awaiting status')
    expect(document.body).toHaveTextContent('Notify API error')
    expect(
      document.body.querySelector(
        'a[href*="notifications.service.gov.uk/services"]'
      )
    ).not.toBeInTheDocument()
  })

  it('shows the email delivery section with an explanatory message when no notification row exists', async () => {
    const quoteWithNoEmail = [
      {
        ...singleQuoteFixture[0],
        emailNotifications: []
      }
    ]
    const document = await loadQuotePageWithQuotes(quoteWithNoEmail)

    expect(document.body).toHaveTextContent('Emails sent to user')
    expect(document.body).toHaveTextContent(
      'No email has been sent for this quote. The levy calculation did not complete.'
    )
  })

  it('returns a 404 page for an unknown quote reference', async () => {
    stubQuotesResponse(singleQuoteFixture)

    const response = await getServer().inject({
      method: 'GET',
      url: '/quote/NRL-999999',
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain(
      'No quote found with reference NRL-999999'
    )
  })

  it('renders an error message when the backend call fails', async () => {
    mswServer.use(
      http.get(
        quotesEndpoint,
        () =>
          new HttpResponse(null, { status: statusCodes.internalServerError })
      )
    )

    const document = await loadQuotePage()

    expect(document.body).toHaveTextContent('There is a problem')
    expect(document.body).toHaveTextContent(
      'An error occurred getting the quote'
    )
  })
})
