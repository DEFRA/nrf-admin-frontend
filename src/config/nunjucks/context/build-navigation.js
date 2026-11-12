const sections = [
  { text: 'Quotes', href: '/', pathPrefixes: ['/quote'] },
  { text: 'Base prices', href: '/base-prices', pathPrefixes: ['/base-prices'] },
  {
    text: 'Inflation index',
    href: '/inflation-index',
    pathPrefixes: ['/inflation-index']
  },
  {
    text: 'Map tile cache',
    href: '/map-tile-cache',
    pathPrefixes: ['/map-tile-cache']
  }
]

/**
 * @param {{ section: { href: string, pathPrefixes: string[] }, path: string }} params
 */
const isActive = ({ section, path }) =>
  path === section.href ||
  section.pathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )

export function buildNavigation(request) {
  const isAuthenticated = request.auth?.isAuthenticated

  if (isAuthenticated) {
    const path = request.path ?? ''
    return [
      ...sections.map((section) => ({
        text: section.text,
        href: section.href,
        active: isActive({ section, path })
      })),
      {
        text: 'Sign out',
        href: '/sign-out'
      }
    ]
  }
  return []
}
