import { http, HttpResponse } from 'msw'

import { config } from '#/config/config.js'

export const inflationIndexesEndpoint = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`

/**
 * Stubs GET /inflation-indexes on the file's MSW server to return the given
 * indexes, newest charging year first.
 *
 * @param {object} params
 * @param {import('msw/node').SetupServer} params.mswServer
 * @param {object[]} params.inflationIndexes
 */
export const stubInflationIndexes = ({ mswServer, inflationIndexes }) =>
  mswServer.use(
    http.get(inflationIndexesEndpoint, () =>
      HttpResponse.json(inflationIndexes)
    )
  )
