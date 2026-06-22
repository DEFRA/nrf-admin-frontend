export function buildNavigation(request) {
  const isAuthenticated = request.auth?.isAuthenticated
  const nav = [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'About',
      href: '/about',
      current: request?.path === '/about'
    }
  ]

  if (isAuthenticated) {
    nav.push({
      text: 'Sign out',
      href: '/sign-out'
    })
  } else {
    nav.push({
      text: 'Sign in',
      href: '/sign-in'
    })
  }

  return nav
}
