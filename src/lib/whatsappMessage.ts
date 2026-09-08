import { formatInvoiceNo } from './retail'

export type WhatsAppLineItem = {
  name: string
  qty: number
  unit: string
  unitType: 'unit' | 'weight' | 'volume' | 'bundle'
  rate: number
  lineTotal: number
}

export type BuildWhatsAppMessageInput = {
  customerName?: string
  phone?: string
  invoiceNumber: string
  invoiceDate?: string
  invoiceUrl?: string
  paymentMode?: string
  items?: WhatsAppLineItem[]
  subtotal?: number
  couponDiscount?: number
  manualDiscountAmount?: number
  shipping?: number
  gstAmount?: number
  total?: number
  remarks?: string
  eyePrescription?: {
    distance: EyePrescriptionMessageRow
    near: EyePrescriptionMessageRow
  }
}

type EyePrescriptionMessageRow = {
  od: { sph: string; cyl: string; axis: string; vn: string }
  os: { sph: string; cyl: string; axis: string; vn: string }
  pd: string
  lensType: string
}
const hasEyePrescriptionValues = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0
  if (!value || typeof value !== 'object') return false
  return Object.values(value).some(hasEyePrescriptionValues)
}

export type AdvanceDepositWhatsAppInput = {
  customerName?: string
  depositId: string
  productName: string
  totalAmount: number
  depositAmount: number
  remainingBalance: number
  expectedDeliveryDate: string
  paymentMethod?: string
}

export const publicInvoiceUrl = (invoiceNumber: string) => {
  const formatted = formatInvoiceNo(invoiceNumber)
  const origin =
    typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://specson.vercel.app'
  return `${origin}/invoice/${encodeURIComponent(formatted)}`
}

export const buildProfessionalWhatsAppMessage = (input: BuildWhatsAppMessageInput) => {
  const customerName = input.customerName?.trim() || 'Valued Customer'
  const invoiceUrl = input.invoiceUrl || publicInvoiceUrl(input.invoiceNumber)
  const formattedNo = formatInvoiceNo(input.invoiceNumber)

  // Each item shows its ORIGINAL price (rate × qty), NOT the discounted line total
  const itemsText = input.items && input.items.length > 0
    ? input.items.map(item => {
        const originalLineAmt = Number(item.rate || 0) * Number(item.qty || 1)
        return `• ${item.name} (x${item.qty}) – ₹ ${originalLineAmt.toFixed(2)}`
      }).join('\n')
    : ''

  // Build totals section separately
  const subtotal = input.subtotal ?? 0
  const couponDisc = input.couponDiscount ?? 0
  const manualDisc = input.manualDiscountAmount ?? 0
  const totalDiscount = couponDisc + manualDisc
  const shipping = input.shipping ?? 0
  const gst = input.gstAmount ?? 0
  const total = input.total ?? 0

  const totalsLines: string[] = []
  if (input.items && input.items.length > 0) {
    totalsLines.push(`Subtotal: ₹ ${subtotal.toFixed(2)}`)
  }
  if (totalDiscount > 0) {
    totalsLines.push(`Discount: -₹ ${totalDiscount.toFixed(2)}`)
  }
  if (shipping > 0) {
    totalsLines.push(`Shipping: ₹ ${shipping.toFixed(2)}`)
  }
  if (gst > 0) {
    totalsLines.push(`GST: ₹ ${gst.toFixed(2)}`)
  }
  if (input.total !== undefined) {
    totalsLines.push(`*Total Amount: ₹ ${total.toFixed(2)}*`)
  }

  const totalsText = totalsLines.join('\n')
  const filledPrescription = input.eyePrescription && hasEyePrescriptionValues(input.eyePrescription) ? input.eyePrescription : null
  const prescriptionText = filledPrescription
    ? `\n👓 *EYE PRESCRIPTION*\nDistance: OD ${filledPrescription.distance.od.sph || '-'} / ${filledPrescription.distance.od.cyl || '-'} / ${filledPrescription.distance.od.axis || '-'} / Vn ${filledPrescription.distance.od.vn || '-'} | OS ${filledPrescription.distance.os.sph || '-'} / ${filledPrescription.distance.os.cyl || '-'} / ${filledPrescription.distance.os.axis || '-'} / Vn ${filledPrescription.distance.os.vn || '-'} | PD ${filledPrescription.distance.pd || '-'} | Lens ${filledPrescription.distance.lensType || '-'}\nNear: OD ${filledPrescription.near.od.sph || '-'} / ${filledPrescription.near.od.cyl || '-'} / ${filledPrescription.near.od.axis || '-'} / Vn ${filledPrescription.near.od.vn || '-'} | OS ${filledPrescription.near.os.sph || '-'} / ${filledPrescription.near.os.cyl || '-'} / ${filledPrescription.near.os.axis || '-'} / Vn ${filledPrescription.near.os.vn || '-'} | PD ${filledPrescription.near.pd || '-'} | Lens ${filledPrescription.near.lensType || '-'}`
    : ''
  const remarksText = input.remarks?.trim() ? `\n📝 *REMARKS:* ${input.remarks.trim()}` : ''

  return `✨ *Specson* ✨
🧵 *Official Purchase Invoice & Receipt* 🧵

Dear ${customerName},

Thank you for shopping with Specson! We truly appreciate your order.

🧾 *INVOICE DETAILS*
📌 *Invoice No:* #${formattedNo}
${input.invoiceDate ? `📅 *Date:* ${new Date(input.invoiceDate).toLocaleDateString('en-IN')}\n` : ''}${input.paymentMode ? `💳 *Payment Mode:* ${input.paymentMode}\n` : ''}
${itemsText ? `📦 *ITEMS ORDERED:*\n${itemsText}\n\n${totalsText}\n` : input.total !== undefined ? `💰 *Total Amount:* ₹ ${total.toFixed(2)}\n` : ''}
${prescriptionText}${remarksText}
📄 *View & Download Digital Invoice / PDF:*
👉 ${invoiceUrl}

🙏 Thank you, and we hope to see you again soon!

Follow us on Instagram:
https://www.instagram.com/specson`
}

export const buildAdvanceDepositWhatsAppMessage = (input: AdvanceDepositWhatsAppInput) => {
  const customerName = input.customerName?.trim() || 'Valued Customer'
  const deliveryDateFormatted = input.expectedDeliveryDate
    ? (() => {
        try {
          return new Date(`${input.expectedDeliveryDate}T00:00:00`).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        } catch {
          return input.expectedDeliveryDate
        }
      })()
    : '-'

  return `🧵 Thank You for Your Advance Order with Specson! 🧵

Dear ${customerName},

✨ Thank you for choosing Specson. We have successfully received your initial advance payment!

🧾 Advance Deposit Details 👇
📦 Deposit ID: ${input.depositId}
👗 Product: ${input.productName}
💵 Total Order Amount: ₹ ${input.totalAmount}
💰 Advance Paid: ₹ ${input.depositAmount}${input.paymentMethod ? ` (${input.paymentMethod.toLowerCase() === 'upi' ? 'QR' : input.paymentMethod.toUpperCase()})` : ''}
🔴 Balance to Pay on Delivery: ₹ ${input.remainingBalance}
📅 Expected Delivery Date: ${deliveryDateFormatted}

.

👓 Processing & preparation for your order is now underway. We will have everything ready on or before ${deliveryDateFormatted} for final payment and delivery/pickup!

.

🙏 Thank you for paying the initial amount as advance!`
}

export const BUSINESS_PHONE = '91XXXXXXXXXX'
