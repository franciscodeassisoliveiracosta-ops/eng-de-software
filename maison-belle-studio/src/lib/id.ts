const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem caracteres ambíguos (0/O, 1/I)

function randomChars(n: number): string {
  const bytes = new Uint8Array(n)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${randomChars(5).toLowerCase()}`
}

/** Código fictício de reserva exibido ao cliente, ex.: MB-7KQ2XR */
export function bookingCode(existing: Set<string>): string {
  let code = ''
  do code = `MB-${randomChars(6)}`
  while (existing.has(code))
  return code
}

export function couponCodeFrom(prefix: string): string {
  return `${prefix}-${randomChars(5)}`
}
