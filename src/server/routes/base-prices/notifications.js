import { statusCodes } from '#/server/common/constants/status-codes.js'

const problemTitle = 'There is a problem'

/** @type {Record<string, { type?: 'success', titleText?: string, text: string }>} */
export const notifications = {
  'base-price-added': { type: 'success', text: 'Base price added.' },
  'base-price-changed': { type: 'success', text: 'Base price changed.' },
  'base-price-deleted': { type: 'success', text: 'Base price deleted.' },
  'base-price-future-exists': {
    titleText: problemTitle,
    text: 'The base price was not added because there is already a base price that has not taken effect yet. Change or delete it first.'
  },
  'base-price-taken-effect': {
    titleText: problemTitle,
    text: 'The base price was not saved because it has already taken effect. A base price can only be changed or deleted before then.'
  },
  'base-price-not-found': {
    titleText: problemTitle,
    text: 'That base price no longer exists.'
  },
  'base-price-error': {
    titleText: problemTitle,
    text: 'The base price was not saved. Check the logs for details.'
  }
}

/**
 * Picks the banner to show once the impact assessor has answered a save.
 *
 * @param {object} params
 * @param {{ error?: string, statusCode?: number }} params.result
 * @param {string} params.success Notification key when the save worked
 * @param {Record<number, string>} [params.byStatus] Notification keys for statuses the impact assessor can reject with
 * @returns {string} A key of `notifications`
 */
export function notificationFor({ result, success, byStatus = {} }) {
  if (!result.error) {
    return success
  }
  return byStatus[result.statusCode] ?? 'base-price-error'
}

export const futureExistsStatus = {
  [statusCodes.conflict]: 'base-price-future-exists'
}
export const takenEffectStatus = {
  [statusCodes.conflict]: 'base-price-taken-effect',
  [statusCodes.notFound]: 'base-price-not-found'
}
