export const inflationIndexPath = '/inflation-index'
export const addInflationIndexPath = '/inflation-index/add'

export const changeInflationIndexPath = (id) =>
  `${inflationIndexPath}/${id}/change`
export const deleteInflationIndexPath = (id) =>
  `${inflationIndexPath}/${id}/delete`

// How many years ahead the add form offers. The index is published annually,
// so any realistic horizon is covered while the list stays bounded.
export const YEAR_OPTIONS = 10
