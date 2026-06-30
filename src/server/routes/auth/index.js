import { authCallbackController } from './auth-callback-controller.js'
import { signInController } from './sign-in-controller.js'
import { signOutController } from './sign-out-controller.js'

export const auth = {
  plugin: {
    name: 'auth-routes',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/sign-in',
          ...signInController
        },
        {
          method: 'GET',
          path: '/sign-out',
          ...signOutController
        },
        {
          method: 'POST',
          path: '/auth/callback',
          handler: authCallbackController.handler,
          options: {
            auth: false,
            plugins: {
              crumb: false
            },
            payload: {
              parse: true,
              allow: 'application/x-www-form-urlencoded'
            }
          }
        },
        {
          method: 'GET',
          path: '/auth/callback',
          handler: authCallbackController.handler,
          options: {
            auth: false
          }
        }
      ])
    }
  }
}
