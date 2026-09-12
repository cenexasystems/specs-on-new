// Indian phone number validation (+91 format)
// Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, 6XXXXXXXXX to 9XXXXXXXXX (10-digit mobiles)
export function normalizePhone(input: string): string | null {
  if (!input) return null

  // Strip everything except digits
  const raw = input.replace(/\D/g, '')
  if (!raw) return null

  let digits = raw

  if (digits.startsWith('91') && digits.length === 12) {
    // Already 91XXXXXXXXXX — keep as-is
  } else if (digits.length === 10 && /^[6-9]/.test(digits)) {
    // 10-digit Indian mobile → prepend country code
    digits = '91' + digits
  } else {
    return null
  }

  // Indian mobiles: 91[6-9]XXXXXXXXX (12 digits total)
  if (!/^91[6-9][0-9]{9}$/.test(digits)) return null

  return digits
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null
}

export function getSubscriberDigits(input: string): string | null {
  const normalized = normalizePhone(input)
  return normalized ? normalized.slice(2) : null
}

export function normalizePhoneForWhatsApp(input: string): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('91') && digits.length === 12) {
    return digits
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return '91' + digits
  }
  return digits
}

export function formatPhoneDisplay(input: string): string {
  if (!input) return input
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2)}`
  }
  return input
}

export function toWhatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone) || normalizePhone(phone)
  const queryParams: string[] = []

  if (normalized) {
    queryParams.push(`phone=${normalized}`)
  }
  if (text) {
    queryParams.push(`text=${encodeURIComponent(text)}`)
  }

  return `https://api.whatsapp.com/send${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`
}
