/**
 * @typedef {object} LevyHistoryEntry
 * @property {string} journey
 * @property {string} calculatedAt ISO date-time the levy was calculated
 * @property {string} provisionalAmount
 * @property {string} inflationAdjustedAmount
 * @property {string} originalBaseAmount
 * @property {string} baseChargePerUnit
 * @property {string} originalBaseChargePerUnit
 * @property {number} units
 * @property {number} modelVersion
 */

/**
 * @param {object} calculation a current or previous calculation from the backend
 * @returns {LevyHistoryEntry}
 */
const toHistoryEntry = (calculation) => ({
  journey: calculation.journey,
  calculatedAt: calculation.calculatedAt,
  provisionalAmount:
    calculation.provisionalAmount ?? calculation.amountExcludingVat,
  inflationAdjustedAmount:
    calculation.inflationAdjustedAmount ?? calculation.amountInflationAdjusted,
  originalBaseAmount: calculation.originalBaseAmount,
  baseChargePerUnit: calculation.baseChargePerUnit,
  originalBaseChargePerUnit: calculation.originalBaseChargePerUnit,
  units: calculation.units,
  modelVersion: calculation.modelVersion
})

/**
 * Every levy calculation for an EDP, the current one and the earlier ones in a
 * single list, most recently calculated first.
 * @param {{ levyGbp: object, previousLevyCalculations?: object[] }} edp
 * @returns {LevyHistoryEntry[]}
 */
export const buildLevyHistory = ({ levyGbp, previousLevyCalculations }) =>
  [levyGbp, ...(previousLevyCalculations ?? [])]
    .map(toHistoryEntry)
    .sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt))
