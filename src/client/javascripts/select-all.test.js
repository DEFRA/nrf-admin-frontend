// @vitest-environment jsdom
import { initSelectAll } from './select-all.js'

const appendCheckbox = (attribute) => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute(attribute, '')
  document.body.appendChild(input)
  return input
}

describe('select-all', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const toggle = (controller) => controller.dispatchEvent(new Event('change'))

  it('checks and unchecks every bulk-select checkbox', () => {
    const controller = appendCheckbox('data-select-all')
    const first = appendCheckbox('data-bulk-select')
    const second = appendCheckbox('data-bulk-select')
    initSelectAll()

    controller.checked = true
    toggle(controller)
    expect(first.checked).toBe(true)
    expect(second.checked).toBe(true)

    controller.checked = false
    toggle(controller)
    expect(first.checked).toBe(false)
    expect(second.checked).toBe(false)
  })

  it('does nothing when there is no select-all checkbox on the page', () => {
    const rowCheckbox = appendCheckbox('data-bulk-select')

    initSelectAll()

    expect(rowCheckbox.checked).toBe(false)
  })
})
