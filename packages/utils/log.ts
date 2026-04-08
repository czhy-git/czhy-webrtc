const warnedMessages = new Set()
/**
 * warn 抛出警告
 * @internal
 * @param {string} 警告内容
 */
export function warn(location: string, message: string) {
  console.warn(`[CZHY WebRTC/${location}]: ${message}`)
}

export function error(location: string, message: string) {
  console.error(`[CZHY WebRTC/${location}]: ${message}`)
}

export function warnOnce(location: string, message: string): void {
  const mergedMessage = `[CZHY WebRTC/${location}]: ${message}`
  if (warnedMessages.has(mergedMessage)) return
  warnedMessages.add(mergedMessage)
  console.error(mergedMessage)
}
