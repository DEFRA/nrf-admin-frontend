import { getByLabelText, getByRole } from '@testing-library/dom'

import { loadPageWithCookie } from './load-page.js'

/**
 * Submits an add form with no requestor and a malformed Jira ticket, then
 * loads the rejected form and asserts both problems are linked from the
 * error summary against the right fields. Shared by the base prices and
 * inflation index add page tests.
 *
 * @param {object} params
 * @param {(payload: Record<string, string>) => Promise<{ cookie: string }>} params.submitAddForm Submits the form with the overrides applied
 * @param {string} params.formUrl
 * @param {import('@hapi/hapi').Server} params.server
 * @param {object} params.auth
 */
export async function expectAddFormShowsRequestorAndJiraTicketProblems({
  submitAddForm,
  formUrl,
  server,
  auth
}) {
  const { cookie } = await submitAddForm({
    requestor: '',
    jiraTicket: '1234'
  })

  const { document } = await loadPageWithCookie({
    requestUrl: formUrl,
    server,
    auth,
    cookie
  })

  expect(
    getByRole(document, 'link', {
      name: 'Enter the name of the person who requested the change'
    })
  ).toHaveAttribute('href', '#requestor')
  expect(
    getByRole(document, 'link', {
      name: 'Enter a Jira ticket reference in the format NRF2-1234'
    })
  ).toHaveAttribute('href', '#jiraTicket')
  expect(getByLabelText(document, 'Jira ticket')).toHaveValue('1234')
}
