import { describe, test, expect } from 'vitest'

import { authScope } from './auth-scope.js'

const SCOPE = '+mockScope'
const TEAM_PATH = '/admin/teams/{teamId}'

describe('#authScope', () => {
  test('Should add scope to route as expected', () => {
    const authScopeMethod = authScope([SCOPE])

    expect(
      authScopeMethod({
        method: 'GET',
        path: TEAM_PATH
      })
    ).toEqual({
      method: 'GET',
      options: {
        auth: {
          access: {
            scope: [SCOPE]
          },
          mode: 'required'
        }
      },
      path: TEAM_PATH
    })
  })

  describe('When route has existing options', () => {
    test('Should add scope to route as expected', () => {
      const authScopeMethod = authScope([SCOPE])

      expect(
        authScopeMethod({
          method: 'POST',
          path: TEAM_PATH,
          options: {
            pre: []
          }
        })
      ).toEqual({
        method: 'POST',
        options: {
          auth: {
            access: {
              scope: [SCOPE]
            },
            mode: 'required'
          },
          pre: []
        },
        path: TEAM_PATH
      })
    })
  })
})
