import { jiraTicketUrl } from '#/server/common/helpers/jira-ticket.js'
import { basePricesPath } from './constants.js'
import { loadBasePrice } from './form-state.js'
import { idParamSchema } from './schemas.js'

export const basePriceDetailsController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const { edp, basePrice } = await loadBasePrice(request.params.id)

    return h.view('base-prices/details', {
      pageTitle: 'Base price details',
      heading: 'Base price details',
      backHref: basePricesPath,
      edpName: edp.edpName,
      basePrice,
      jiraTicketUrl: jiraTicketUrl(basePrice.jiraTicket)
    })
  }
}
