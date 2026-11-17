const visuallyHiddenText = (text) =>
  `<span class="govuk-visually-hidden">${text}</span>`

const actionLink = ({ href, text, hiddenText }) =>
  `<a class="govuk-link" href="${href}">${text}${visuallyHiddenText(hiddenText)}</a>`

/** Mirrors govukTag({ text: 'In force', classes: 'govuk-tag--blue' }) */
const inForceTag = '<strong class="govuk-tag govuk-tag--blue">In force</strong>'

const yearCell = ({ chargingYear, isInForce }) =>
  isInForce ? `${chargingYear} ${inForceTag}` : String(chargingYear)

const actionsCell = (inflationIndex) => {
  const { chargingYear } = inflationIndex
  const links = [
    actionLink({
      href: inflationIndex.detailsPath,
      text: 'View details',
      hiddenText: ` of the inflation index for ${chargingYear}`
    })
  ]
  if (inflationIndex.isFuture) {
    links.push(
      '<br>',
      actionLink({
        href: inflationIndex.changePath,
        text: 'Change',
        hiddenText: ` the inflation index for ${chargingYear}`
      }),
      '<br>',
      actionLink({
        href: inflationIndex.deletePath,
        text: 'Delete',
        hiddenText: ` the inflation index for ${chargingYear}`
      })
    )
  }
  return links.join('')
}

/**
 * The list page's table rows, one per index in the order they were loaded
 * (newest charging year first).
 *
 * @param {object} params
 * @param {import('./list-controller.js').InflationIndexViewModel[]} params.inflationIndexes View models from the list controller
 * @returns {{ html: string } | { text: string, format: string }[][]} Rows for the govukTable macro
 */
export const toTableRows = ({ inflationIndexes }) =>
  inflationIndexes.map((inflationIndex) => [
    { html: yearCell(inflationIndex) },
    { text: inflationIndex.cilIndex, format: 'numeric' },
    { text: inflationIndex.indexFactor.toFixed(4), format: 'numeric' },
    { html: actionsCell(inflationIndex) }
  ])
