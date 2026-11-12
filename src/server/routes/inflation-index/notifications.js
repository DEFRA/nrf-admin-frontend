import { statusCodes } from '#/server/common/constants/status-codes.js'
import { inflationIndexPath } from './constants.js'

const problemTitle = 'There is a problem'

/** @type {Record<string, { type?: 'success', titleText?: string, text: string }>} */
export const notifications = {
  'inflation-index-added': {
    type: 'success',
    text: 'Inflation index added.'
  },
  'inflation-index-changed': {
    type: 'success',
    text: 'Inflation index changed.'
  },
  'inflation-index-deleted': {
    type: 'success',
    text: 'Inflation index deleted. The existing inflation index will continue to apply.'
  },
  'inflation-index-year-exists': {
    titleText: problemTitle,
    text: 'The inflation index was not added because that year already has one.'
  },
  'inflation-index-taken-effect': {
    titleText: problemTitle,
    text: 'The inflation index was not saved because the year has already begun. An inflation index can only be changed or deleted before its year begins.'
  },
  'inflation-index-in-use': {
    titleText: problemTitle,
    text: 'The inflation index was not deleted because it has been used to price a quote.'
  },
  'inflation-index-not-found': {
    titleText: problemTitle,
    text: 'That inflation index no longer exists.'
  },
  'inflation-index-error': {
    titleText: problemTitle,
    text: 'The inflation index was not saved. Check the logs for details.'
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
  return byStatus[result.statusCode] ?? 'inflation-index-error'
}

export const yearExistsStatus = {
  [statusCodes.conflict]: 'inflation-index-year-exists'
}

export const takenEffectStatus = {
  [statusCodes.conflict]: 'inflation-index-taken-effect',
  [statusCodes.notFound]: 'inflation-index-not-found'
}

// A 409 can mean the year began (taken effect) or the index priced a quote
// (in use); the impact assessor's detail says which.
const takenEffectOrInUse = (detail) =>
  detail?.includes('used to price a quote')
    ? 'inflation-index-in-use'
    : 'inflation-index-taken-effect'

/**
 * Maps the impact assessor's answer to a delete, telling the two 409s apart.
 *
 * @param {object} params
 * @param {{ error?: string, statusCode?: number, detail?: string }} params.result
 * @returns {string} A key of `notifications`
 */
export function notificationForDelete({ result }) {
  if (!result.error) {
    return 'inflation-index-deleted'
  }
  if (result.statusCode === statusCodes.conflict) {
    return takenEffectOrInUse(result.detail)
  }
  if (result.statusCode === statusCodes.notFound) {
    return 'inflation-index-not-found'
  }
  return 'inflation-index-error'
}

/**
 * @param {object} params
 * @param {import('@hapi/hapi').ResponseToolkit} params.h
 * @param {string} params.notification A key of `notifications`
 */
export const redirectToList = ({ h, notification }) =>
  h.redirect(`${inflationIndexPath}?notification=${notification}`)
