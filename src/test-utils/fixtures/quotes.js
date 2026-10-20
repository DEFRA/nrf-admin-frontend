const SEND_REQUEST_AT = '2026-03-23T10:00:00.000Z'

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
      sendRequestAt: SEND_REQUEST_AT,
      notifySendStatus: 'delivered',
      emailType: 'quote_results',
      sendRetryCount: 0,
      notifyStatusUrl:
        'https://www.notifications.service.gov.uk/services/a76741a1-42be-4231-ae74-15ec14b81a11/notification/47cbb989-9546-418c-8828-232c3dc57537'
    },
    emailNotifications: [
      {
        emailType: 'quote_results',
        notifySendStatus: 'delivered',
        sendRetryCount: 0,
        sendRequestAt: SEND_REQUEST_AT,
        notificationId: '47cbb989-9546-418c-8828-232c3dc57537',
        notifyStatusUrl:
          'https://www.notifications.service.gov.uk/services/a76741a1-42be-4231-ae74-15ec14b81a11/notification/47cbb989-9546-418c-8828-232c3dc57537'
      }
    ],
    disableAnalyticsAudit: false,
    deleteEligible: true,
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
        catchments: [
          {
            label: 'Broads SAC',
            catchmentId: '27',
            catchmentOverlapPercentage: 67.4
          },
          {
            label: 'River Wensum SAC',
            catchmentId: '29',
            catchmentOverlapPercentage: 32.6
          }
        ],
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
      notifySendStatus: 'sending',
      emailType: 'quote_results',
      sendRetryCount: 3,
      notifyStatusUrl: null
    },
    emailNotifications: [
      {
        emailType: 'quote_results',
        notifySendStatus: 'sending',
        sendRetryCount: 3,
        sendRequestAt: '2026-04-01T10:05:00.000Z',
        notificationId: null,
        notifyStatusUrl: null
      }
    ],
    disableAnalyticsAudit: false,
    deleteEligible: true,
    edps: [],
    levyGbp: null
  },
  ...singleQuoteFixture
]

// A quote the backend has flagged as not deletable — in production, only
// quotes created with an approved internal email address can be deleted.
export const ineligibleQuoteFixture = [
  {
    ...singleQuoteFixture[0],
    reference: 'NRL-000003',
    email: {
      ...singleQuoteFixture[0].email,
      address: 'developer@housebuilder.com'
    },
    deleteEligible: false
  }
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
        baseChargePerUnit: '2675.0000',
        roundedBaseChargePerUnit: '2675.00',
        amountExcludingVat: '26750.00',
        amountInflationAdjusted: '28187.50',
        baseAmount: '26750.00',
        inflationRate: 0.05,
        modelVersion: 1
      }
    }
  ],
  levyGbp: {
    levyAmountExcludingVat: 26750.0,
    levyAmountInflationAdjusted: 28187.5
  }
}

const NOTIFY_STATUS_URL_PREFIX =
  'https://www.notifications.service.gov.uk/services/a76741a1-42be-4231-ae74-15ec14b81a11/notification'

// A quote whose initial email came back temporary-failure and was re-sent
// successfully by the retry worker — the per-attempt history shape the
// backend returns since NRF2-1258.
export const quoteWithRetriedEmailFixture = {
  ...singleQuoteFixture[0],
  reference: 'NRL-000004',
  email: {
    ...singleQuoteFixture[0].email,
    notifySendStatus: 'delivered',
    sendRetryCount: 1,
    notificationId: '8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d',
    notifyStatusUrl: `${NOTIFY_STATUS_URL_PREFIX}/8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d`
  },
  emailNotifications: [
    {
      emailType: 'quote_results',
      notifySendStatus: 'delivered',
      sendRetryCount: 1,
      sendRequestAt: SEND_REQUEST_AT,
      notificationId: '8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d',
      notifyStatusUrl: `${NOTIFY_STATUS_URL_PREFIX}/8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d`,
      attempts: [
        {
          attemptNo: 1,
          notificationId: '47cbb989-9546-418c-8828-232c3dc57537',
          notifySendStatus: 'temporary-failure',
          attemptedAt: '2026-03-23T10:00:05.000Z',
          notifyStatusUrl: `${NOTIFY_STATUS_URL_PREFIX}/47cbb989-9546-418c-8828-232c3dc57537`
        },
        {
          attemptNo: 2,
          notificationId: '8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d',
          notifySendStatus: 'delivered',
          attemptedAt: '2026-03-23T10:05:00.000Z',
          notifyStatusUrl: `${NOTIFY_STATUS_URL_PREFIX}/8b1dcb42-6ea5-49d3-9cb0-0f4e5a1b2c3d`
        }
      ]
    }
  ]
}

// A quote whose initial send Notify rejected outright — no notification id,
// one attempt row recording that a send was attempted all the same.
export const quoteWithRejectedEmailFixture = {
  ...singleQuoteFixture[0],
  reference: 'NRL-000005',
  email: {
    ...singleQuoteFixture[0].email,
    notifySendStatus: null,
    sendRetryCount: 1,
    notificationId: null,
    notifyStatusUrl: null
  },
  emailNotifications: [
    {
      emailType: 'quote_results',
      notifySendStatus: null,
      sendRetryCount: 1,
      sendRequestAt: SEND_REQUEST_AT,
      notificationId: null,
      notifyStatusUrl: null,
      attempts: [
        {
          attemptNo: 1,
          notificationId: null,
          notifySendStatus: null,
          attemptedAt: SEND_REQUEST_AT,
          notifyStatusUrl: null
        }
      ]
    }
  ]
}
