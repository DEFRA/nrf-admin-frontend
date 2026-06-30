export function buildNavigation(request) {
  const isAuthenticated = request.auth?.isAuthenticated

  if (isAuthenticated) {
    return [
      {
        text: 'Sign out',
        href: '/sign-out'
      }
    ]
  }
  return []
}
