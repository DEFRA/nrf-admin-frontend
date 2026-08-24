export const singleQuoteFixture = [
  {
    id: 1,
    reference: 'NRL-000001',
    createdAt: '2026-03-23T00:00:00.000Z',
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
    reference: 'NRL-000002',
    createdAt: '2026-04-01T10:00:00.000Z',
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
    edps: []
  },
  ...singleQuoteFixture
]
