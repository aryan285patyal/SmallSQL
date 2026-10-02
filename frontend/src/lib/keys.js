// Global shortcuts should not fire while the user is typing in a field.
export const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
