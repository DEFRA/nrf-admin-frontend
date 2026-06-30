import { config } from '#/config/config.js'

const callbackPath = config.get('auth.oidc.loginCallbackUri')

export const signInController = {
  options: {
    auth: false
  },
  handler: async (request, h) => {
    const refererPath = getRefererAsRelativeURL(request?.info?.referrer, '/')
    request.yar.flash('referrer', refererPath)
    return request.login(h)
  }
}

function getRefererAsRelativeURL(referer, defaultPath) {
  let relative = defaultPath
  if (referer) {
    try {
      const url = new URL(referer)
      relative = url.pathname + url.search
    } catch {
      if (referer.startsWith('/')) {
        relative = referer
      }
    }
  }

  if (relative.startsWith(callbackPath)) {
    relative = defaultPath
  }

  return relative
}
