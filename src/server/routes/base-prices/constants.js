// The only EDP for now; the add page will offer a choice of EDP later
export const DEFAULT_EDP_ID = 1

export const basePricesPath = '/base-prices'
export const addBasePricePath = '/base-prices/add'

export const changeBasePricePath = (id) => `${basePricesPath}/${id}/change`
export const deleteBasePricePath = (id) => `${basePricesPath}/${id}/delete`
