export function announceToScreenReader(message: string) {
  const announcer = document.getElementById('a11y-announcer')
  if (announcer) {
    announcer.textContent = message
  }
}
