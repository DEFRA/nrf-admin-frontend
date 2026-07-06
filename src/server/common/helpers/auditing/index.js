import { audit } from '@defra/cdp-auditing'
import { auditEvents } from '../../constants/audit-events.js'

export function auditSignIn(user) {
  audit({
    event: {
      category: auditEvents.admin.category,
      action: auditEvents.admin.signIn
    },
    context: { user }
  })
}

export function auditSignOut(user) {
  audit({
    event: {
      category: auditEvents.admin.category,
      action: auditEvents.admin.signOut
    },
    context: { user }
  })
}
