export const singleQuoteFixture = [
  {
    id: 1,
    reference: 'NRL-000001',
    createdAt: '2026-03-23T00:00:00.000Z',
    planningType: 'full-planning-permission',
    housingUnits: 10,
    boundary: {
      geoJsonWgs84: '{"type":"Polygon"}',
      userInputType: 'draw',
      filename: null
    },
    email: {
      address: 'developer@housebuilder.com',
      sendRequestAt: null,
      status: 'delivered',
      notifyStatusUrl:
        'https://www.notifications.service.gov.uk/services/a76741a1-42be-4231-ae74-15ec14b81a11/notification/47cbb989-9546-418c-8828-232c3dc57537'
    },
    disableAnalyticsAudit: false,
    edps: [
      {
        edpId: 42,
        edpName: 'Norfolk Fens East',
        edpType: 'NUTRIENT',
        impact: {
          nitrogenTotal: {
            amount: 80,
            band: { min: 1, max: 3 },
            unit: 'mg/l N'
          },
          phosphorusTotal: {
            amount: 60,
            band: { min: 1, max: 4 },
            unit: 'mg/l TP'
          }
        },
        levyGbp: {
          amountExcludingVat: '999.00',
          amountInflationAdjusted: '999.00',
          baseAmount: '999.00',
          modelVersion: 1
        }
      }
    ],
    levyGbp: {
      levyAmountExcludingVat: 999,
      levyAmountInflationAdjusted: 999
    }
  }
]

export const multipleQuotesFixture = [
  {
    id: 2,
    reference: 'NRL-000002',
    createdAt: '2026-04-01T10:00:00.000Z',
    planningType: 'outline-planning-permission',
    housingUnits: 5,
    boundary: {
      geoJsonWgs84: '{"type":"Polygon"}',
      userInputType: 'upload',
      filename: 'boundary.shp'
    },
    email: {
      address: 'another@developer.com',
      sendRequestAt: '2026-04-01T10:05:00.000Z',
      status: 'sending',
      notifyStatusUrl: null
    },
    disableAnalyticsAudit: false,
    edps: [],
    levyGbp: null
  },
  ...singleQuoteFixture
]

// Shape the quote API will return once the levy breakdown fields (units,
// base charge price per unit, rounded price, inflation rate) are plumbed
// through impact-assessor and nrf-backend. Values mirror the NRF2-316 example.
export const quoteWithLevyBreakdownFixture = {
  ...singleQuoteFixture[0],
  edps: [
    {
      ...singleQuoteFixture[0].edps[0],
      levyGbp: {
        units: 10,
        baseChargePerUnit: '2193.6649',
        roundedBaseChargePerUnit: '2193.66',
        amountExcludingVat: '21936.60',
        amountInflationAdjusted: '23033.43',
        baseAmount: '21936.60',
        inflationRate: 0.05,
        modelVersion: 1
      }
    }
  ],
  levyGbp: {
    levyAmountExcludingVat: 21936.6,
    levyAmountInflationAdjusted: 23033.43
  }
}
