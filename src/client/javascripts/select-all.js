// Ticks or unticks every eligible-quote checkbox on the quotes table when
// the header "select all" checkbox changes. Progressive enhancement —
// without JS each row can still be ticked individually.
const initSelectAll = () => {
  const controller = document.querySelector('[data-select-all]')
  const checkboxes = document.querySelectorAll('[data-bulk-select]')

  if (!controller || checkboxes.length === 0) {
    return
  }

  controller.addEventListener('change', () => {
    for (const checkbox of checkboxes) {
      checkbox.checked = controller.checked
    }
  })
}

export { initSelectAll }
