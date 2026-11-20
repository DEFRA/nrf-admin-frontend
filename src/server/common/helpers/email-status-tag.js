const RED = 'govuk-tag--red'
const GREY = 'govuk-tag--grey'

/**
 * Map a GOV.UK Notify delivery status to a GOV.UK tag ({ text, classes }).
 * @param {string | null} status
 * @param {string | null} emailType
 * @param {string | null} [notificationId] - pass null explicitly to signal a failed send
 * @returns {{ text: string, classes: string }}
 */
export const emailStatusTag = (status, emailType, notificationId) => {
  if (!emailType) {
    return { text: 'Not sent', classes: GREY }
  }
  if (notificationId === null) {
    return { text: 'Notify API error', classes: RED }
  }
  switch (status) {
    case 'delivered':
      return { text: 'Delivered', classes: 'govuk-tag--green' }
    case 'permanent-failure':
      return { text: 'Permanent failure', classes: RED }
    case 'technical-failure':
      return { text: 'Technical failure', classes: RED }
    case 'temporary-failure':
      return { text: 'Temporary failure', classes: 'govuk-tag--yellow' }
    case 'created':
    case 'sending':
      return { text: 'Sending', classes: 'govuk-tag--blue' }
    default:
      return { text: 'Awaiting status', classes: GREY }
  }
}
