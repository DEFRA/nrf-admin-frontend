import {
  createAll,
  Button,
  CharacterCount,
  Checkboxes,
  ErrorSummary,
  NotificationBanner,
  Radios,
  SkipLink,
  Tabs
} from 'govuk-frontend'

import { initSelectAll } from './select-all.js'

createAll(Button)
createAll(CharacterCount)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(NotificationBanner)
createAll(Radios)
createAll(SkipLink)
createAll(Tabs)

initSelectAll()
