import { getInflationIndexHistory } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import { toHistoryTableRows } from './history-table-rows.js'

/**
 * The additions history: one row per index added, most recent first. Rows
 * outlive their index, so a deleted index's addition is still listed.
 */
export const inflationIndexHistoryController = {
  async handler(_request, h) {
    const result = await getInflationIndexHistory()
    const history = result.history ?? []

    return h.view('inflation-index/history', {
      pageTitle: 'Inflation index additions',
      heading: 'Inflation index additions',
      backHref: inflationIndexPath,
      errorMessage: result.error
        ? 'The additions history could not be loaded. Check the logs for details.'
        : undefined,
      tableRows: toHistoryTableRows({ history }),
      hasChanges: history.length > 0
    })
  }
}
