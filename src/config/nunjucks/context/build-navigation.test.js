import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([])
  })

  test('Should show sign-out when authenticated', () => {
    expect(
      buildNavigation(
        mockRequest({ path: '/', auth: { isAuthenticated: true } })
      )
    ).toEqual([
      {
        href: '/sign-out',
        text: 'Sign out'
      }
    ])
  })
})
