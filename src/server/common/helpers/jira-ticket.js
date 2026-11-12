const JIRA_BROWSE_URL = 'https://eaflood.atlassian.net/browse/'
const JIRA_TICKET_PATTERN = /^NRF2-\d{1,10}$/

/**
 * @param {string} rawTicket
 * @returns {{ value?: string, error?: string }} The ticket in upper case, like NRF2-1234
 */
export function validateJiraTicket(rawTicket) {
  if (!rawTicket) {
    return { error: 'Enter the Jira ticket reference' }
  }
  const ticket = rawTicket.toUpperCase()
  if (!JIRA_TICKET_PATTERN.test(ticket)) {
    return { error: 'Enter a Jira ticket reference in the format NRF2-1234' }
  }
  return { value: ticket }
}

/**
 * @param {string | null | undefined} ticket
 * @returns {string | undefined} The ticket's Jira page, or undefined when there is no valid ticket
 */
export const jiraTicketUrl = (ticket) =>
  JIRA_TICKET_PATTERN.test(ticket ?? '')
    ? `${JIRA_BROWSE_URL}${ticket}`
    : undefined
