import { http, HttpResponse } from 'msw'

/**
 * Stubs an endpoint on the file's MSW server, recording every request's
 * headers and body. Shared by the impact assessor service tests.
 *
 * @param {object} params
 * @param {import('msw/node').SetupServer} params.mswServer
 * @param {'get' | 'post' | 'patch' | 'delete'} params.method
 * @param {string} params.url
 * @param {() => import('msw').HttpResponse} params.respond
 * @returns {Promise<{ headers: Headers, body?: string }>[]} The requests made so far
 */
export function captureRequests({ mswServer, method, url, respond }) {
  const requests = []
  mswServer.use(
    http[method](url, async ({ request }) => {
      requests.push({
        headers: request.headers,
        body: (await request.text()) || undefined
      })
      return respond()
    })
  )
  return requests
}

/** A responder that fails the call with the given status and body. */
export const failWith = (status, body) => () =>
  HttpResponse.json(body, { status })
