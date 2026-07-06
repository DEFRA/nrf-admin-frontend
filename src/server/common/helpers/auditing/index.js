import { audit } from '@defra/cdp-auditing'

export function auditSignIn(user) {
  audit({
    event: { category: 'auth', action: 'sign-in' },
    context: { user }
  })
}

export function auditSignOut(user) {
  audit({
    event: { category: 'auth', action: 'sign-out' },
    context: { user }
  })
}
