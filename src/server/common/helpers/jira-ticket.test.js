import { jiraTicketUrl, validateJiraTicket } from './jira-ticket.js'

describe('validateJiraTicket', () => {
  it.each([
    ['NRF2-1234', 'NRF2-1234'],
    ['nrf2-1234', 'NRF2-1234'],
    ['NRF2-1', 'NRF2-1']
  ])('accepts %s', (rawTicket, expected) => {
    expect(validateJiraTicket(rawTicket)).toEqual({ value: expected })
  })

  it('asks for the ticket when it is empty', () => {
    expect(validateJiraTicket('').error).toBe('Enter the Jira ticket reference')
  })

  it.each([
    ['1234'],
    ['NRF2-'],
    ['NRF2-12a'],
    ['NRF-1234'],
    ['NRF2 1234'],
    ['NRF2-12345678901'],
    ['https://eaflood.atlassian.net/browse/NRF2-1234']
  ])('rejects %s', (rawTicket) => {
    expect(validateJiraTicket(rawTicket).error).toContain('format NRF2-1234')
  })
})

describe('jiraTicketUrl', () => {
  it('links to the ticket in Jira', () => {
    expect(jiraTicketUrl('NRF2-1234')).toBe(
      'https://eaflood.atlassian.net/browse/NRF2-1234'
    )
  })

  it.each([[null], [undefined], [''], ['not a ticket'], ['NRF2-1234/../x']])(
    'gives no link for %s',
    (ticket) => {
      expect(jiraTicketUrl(ticket)).toBeUndefined()
    }
  )
})
