import { jiraTicketUrl } from '#/server/common/helpers/jira-ticket.js'
import { inflationIndexPath } from './constants.js'
import { loadInflationIndex } from './form-state.js'
import { idParamSchema } from './schemas.js'

export const inflationIndexDetailsController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const inflationIndex = await loadInflationIndex(request.params.id)

    return h.view('inflation-index/details', {
      pageTitle: 'Inflation index details',
      heading: 'Inflation index details',
      backHref: inflationIndexPath,
      inflationIndex,
      jiraTicketUrl: jiraTicketUrl(inflationIndex.jiraTicket)
    })
  }
}
