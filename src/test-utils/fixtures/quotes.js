export const singleQuoteFixture = [
  {
    id: 1,
    reference: 'NRF-000001',
    createdAt: '2026-03-23T00:00:00.000Z',
    development: {
      types: ['housing', 'other-residential'],
      residentialBuildingCount: 10,
      peopleCount: 5
    },
    boundary: {
      geoJsonWgs84: '{"type":"Polygon"}',
      userInputType: 'draw',
      filename: null
    },
    wasteWaterTreatmentWorksId: '101',
    wasteWaterTreatmentWorksName: 'Great Billing WRC',
    email: {
      address: 'developer@housebuilder.com',
      sendRequestAt: null
    },
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
          min: '100.00',
          max: '200.00'
        }
      }
    ]
  }
]

export const multipleQuotesFixture = [
  {
    id: 2,
    reference: 'NRF-000002',
    createdAt: '2026-04-01T10:00:00.000Z',
    development: {
      types: ['housing'],
      residentialBuildingCount: 5,
      peopleCount: null
    },
    boundary: {
      geoJsonWgs84: '{"type":"Polygon"}',
      userInputType: 'upload',
      filename: 'boundary.shp'
    },
    wasteWaterTreatmentWorksId: null,
    wasteWaterTreatmentWorksName: null,
    email: {
      address: 'another@developer.com',
      sendRequestAt: '2026-04-01T10:05:00.000Z'
    },
    edps: []
  },
  ...singleQuoteFixture
]
