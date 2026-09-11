import { getByRole, queryByRole, queryByText } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import {
  singleQuoteFixture,
  quoteWithLevyBreakdownFixture,
  ineligibleQuoteFixture
} from '#/test-utils/fixtures/quotes.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { config } from '#/config/config.js'

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

  it('renders a back link to the quotes list', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      getByRole(document, 'link', { name: 'Back to quotes' })
    ).toHaveAttribute('href', '/')
  })

  it('renders the quote summary with the total levy amounts in pounds sterling', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(document.body).toHaveTextContent('Date submitted')
    expect(document.body).toHaveTextContent('23 Mar 2026 at 00:00')
    expect(document.body).toHaveTextContent('Reference')
    expect(document.body).toHaveTextContent('NRL-000001')
    expect(document.body).toHaveTextContent('full-planning-permission')
    expect(document.body).toHaveTextContent('Number of units')
    expect(document.body).toHaveTextContent('10')
    expect(document.body).toHaveTextContent('Total rounded levy amount')
    expect(document.body).toHaveTextContent('£999.00')
    expect(document.body).toHaveTextContent(
      'Total inflation adjusted levy amount'
    )
  })

  it('renders the provisional levy amount for each EDP', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(document.body).toHaveTextContent('Levy breakdown by EDP')
    expect(document.body).toHaveTextContent('Norfolk Fens East')
    expect(document.body).toHaveTextContent('Levy calculation')
    expect(document.body).toHaveTextContent(
      'Provisional nature restoration levy amount'
    )
    expect(document.body).toHaveTextContent('£999.00')
  })

  it('omits breakdown rows the backend does not yet supply', async () => {
    const document = await loadQuotePageWithQuotes(singleQuoteFixture)

    expect(
      queryByText(document, 'Base charge price per unit')
    ).not.toBeInTheDocument()
    expect(
      queryByText(document, 'Rounded base charge price per unit')
    ).not.toBeInTheDocument()
    expect(queryByText(document, 'Inflation rate')).not.toBeInTheDocument()
    expect(queryByText(document, 'Calculation steps')).not.toBeInTheDocument()
  })

  it('renders the full calculation breakdown when breakdown fields are present', async () => {
    const document = await loadQuotePageWithQuotes([
      quoteWithLevyBreakdownFixture
    ])

    expect(document.body).toHaveTextContent(
      'Number of units used in the calculation'
    )
    expect(document.body).toHaveTextContent('Base charge price per unit')
    expect(document.body).toHaveTextContent('£2,193.6649')
    expect(document.body).toHaveTextContent(
      'Rounded base charge price per unit'
    )
    expect(document.body).toHaveTextContent('Inflation rate')
    expect(document.body).toHaveTextContent('5%')
    expect(document.body).toHaveTextContent('Calculation steps')
    expect(document.body).toHaveTextContent(
      'Round base charge price per unit: £2,193.6649 → £2,193.66'
    )
    expect(document.body).toHaveTextContent(
      'Calculate provisional levy amount: 10 × £2,193.66 = £21,936.60'
    )
    expect(document.body).toHaveTextContent(
      'Provisional nature restoration levy amount: £21,936.60'
    )
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
    expect(document.body).toHaveTextContent('Notification ID')
    expect(document.body).toHaveTextContent(
      '47cbb989-9546-418c-8828-232c3dc57537'
    )
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
    expect(document.body).toHaveTextContent('Notification ID')
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
