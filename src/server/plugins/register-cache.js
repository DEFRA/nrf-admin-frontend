export const registerCachePlugin = {
  name: 'register-cache',
  register: async function (server, { name, segment, ttl }) {
    const cache = server.cache({
      cache: name,
      segment,
      expiresIn: ttl
    })
    server.decorate('server', 'sessionCache', cache)
  }
}
