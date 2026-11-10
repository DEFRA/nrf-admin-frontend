import { getByRole, queryByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { setupTestServer } from '#/test-utils/setup-test-server.js'
import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { loadPage, authenticatedRequest } from '#/test-utils/load-page.js'
import { config } from '#/config/config.js'

const tileCacheEndpoint = `${config.get('frontend.apiUrl')}/admin/tile-cache`
const mswServer = setupMswServer()

describe('Map tile cache page', () => {
  const getServer = setupTestServer()

  const loadTileCachePage = (query = '') =>
    loadPage({
      requestUrl: `/map-tile-cache${query}`,
      server: getServer(),
      auth: authenticatedRequest
    })

  it('renders the heading and the clear button', async () => {
    const document = await loadTileCachePage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Map tile cache'
    )
    expect(
      getByRole(document, 'button', { name: 'Clear map tile cache' })
    ).toBeInTheDocument()
  })

  it('is no longer on the quotes page', async () => {
    mswServer.use(
      http.get(`${config.get('backend.apiUrl')}/quotes`, () =>
        HttpResponse.json([])
      )
    )

    const document = await loadPage({
      requestUrl: '/',
      server: getServer(),
      auth: authenticatedRequest
    })

    expect(
      queryByRole(document, 'button', { name: 'Clear map tile cache' })
    ).not.toBeInTheDocument()
  })

  it('clears the cache and reports how many tiles were removed', async () => {
    mswServer.use(
      http.delete(tileCacheEndpoint, () => HttpResponse.json({ count: 3 }))
    )

    const response = await getServer().inject({
      method: 'POST',
      url: '/map-tile-cache/clear',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/map-tile-cache?notification=tile-cache-cleared&count=3'
    )
  })

  it('reports a failure to clear the cache', async () => {
    mswServer.use(
      http.delete(
        tileCacheEndpoint,
        () => new HttpResponse(null, { status: 500 })
      )
    )

    const response = await getServer().inject({
      method: 'POST',
      url: '/map-tile-cache/clear',
      payload: {},
      auth: authenticatedRequest
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/map-tile-cache?notification=tile-cache-error'
    )
  })

  it.each([
    [
      '?notification=tile-cache-cleared&count=1',
      'Map tile cache cleared successfully. 1 tile removed.'
    ],
    [
      '?notification=tile-cache-cleared&count=3',
      'Map tile cache cleared successfully. 3 tiles removed.'
    ],
    ['?notification=tile-cache-error', 'Failed to clear the map tile cache']
  ])('shows the banner for %s', async (query, text) => {
    const document = await loadTileCachePage(query)

    expect(document.body).toHaveTextContent(text)
  })
})
