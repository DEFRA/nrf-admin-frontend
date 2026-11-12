import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

const signedIn = { isAuthenticated: true }

describe('#buildNavigation', () => {
  it('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([])
  })

  it('Should show the sections and sign-out when authenticated', () => {
    expect(
      buildNavigation(mockRequest({ path: '/', auth: signedIn })).map(
        ({ text, href }) => ({ text, href })
      )
    ).toEqual([
      { text: 'Quotes', href: '/' },
      { text: 'Base prices', href: '/base-prices' },
      { text: 'Map tile cache', href: '/map-tile-cache' },
      { text: 'Sign out', href: '/sign-out' }
    ])
  })

  it.each([
    ['/', 'Quotes'],
    ['/quote/NRL-000001', 'Quotes'],
    ['/quotes/delete', undefined],
    ['/map-tile-cache', 'Map tile cache'],
    ['/base-prices', 'Base prices'],
    ['/base-prices/12/change', 'Base prices'],
    ['/about', undefined]
  ])('Should mark the section for %s as active', (path, activeText) => {
    const active = buildNavigation(mockRequest({ path, auth: signedIn }))
      .filter((item) => item.active)
      .map((item) => item.text)

    expect(active).toEqual(activeText ? [activeText] : [])
  })
})
