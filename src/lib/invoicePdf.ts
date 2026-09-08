import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { BRAND_ADDRESS, BRAND_EN, BRAND_PHONE_DISPLAY } from './brand'
import { formatCurrency, formatQuantityDisplay, normalizeStructuredOrderItem, formatInvoiceNo } from './retail'
import { LOGO_BASE64 } from './logoBase64'

export type InvoicePdfData = {
  invoiceNo: string
  date: string
  customerName: string
  phone: string
  address: string
  items: Array<Record<string, unknown>>
  subtotal: number
  shipping: number
  total: number
  discountAmount?: number
  manualDiscountAmount?: number
  gstAmount?: number
  couponCode?: string | null
  paymentMode?: string
  remarks?: string
  eyePrescription?: {
    distance: { od: EyePrescriptionRow; os: EyePrescriptionRow; pd: string; lensType: string }
    near: { od: EyePrescriptionRow; os: EyePrescriptionRow; pd: string; lensType: string }
  }
}

type EyePrescriptionRow = { sph: string; cyl: string; axis: string; vn: string }

const hasPrescriptionValues = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0
  if (!value || typeof value !== 'object') return false
  return Object.values(value).some(hasPrescriptionValues)
}

const money = (value: number) => formatCurrency(Number(value || 0)).replace(/\s+/g, ' ')

/** Creates a compact A4 invoice that can be attached as a file to WhatsApp. */
export function createInvoicePdf(data: InvoicePdfData): Blob {
  const formattedNo = formatInvoiceNo(data.invoiceNo)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const left = 16
  const right = 194
  const primaryColor = '#3B261B' // Specson Orange
  const ink = '#18202a'
  const muted = '#68717c'
  let y = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(muted)
  doc.text('TAX INVOICE', left, y)
  doc.text(`Invoice: #${formattedNo}`, right, y, { align: 'right' })
  y += 7
  doc.setDrawColor('#d8dce0')
  doc.line(left, y, right, y)
  y += 10

  try {
    doc.addImage(LOGO_BASE64, 'PNG', left, y, 20, 20)
  } catch {
    doc.setTextColor(primaryColor)
    doc.setFontSize(16)
    doc.text(BRAND_EN, left, y + 10)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(primaryColor)
  doc.text(BRAND_EN, left + 24, y + 5)
  doc.setFontSize(8)
  doc.setTextColor(muted)
  doc.setFont('helvetica', 'normal')
  doc.text(BRAND_ADDRESS, left + 24, y + 10, { maxWidth: 85 })
  doc.text(`Phone: ${BRAND_PHONE_DISPLAY}`, left + 24, y + 18)
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN')}`, right, y + 2, { align: 'right' })
  doc.text(`Payment: ${data.paymentMode || 'POS'}`, right, y + 7, { align: 'right' })
  y += 28

  const customerName = String(data.customerName || 'Walk-in Customer').trim()
  const customerPhone = String(data.phone || '—').trim()
  const customerAddress = String(data.address || '').trim()
  const customerNameLines = doc.splitTextToSize(customerName, 165) as string[]
  const customerAddressLines = customerAddress
    ? doc.splitTextToSize(`Address: ${customerAddress}`, 165) as string[]
    : []
  const customerBoxHeight = 19 + customerNameLines.length * 4 + customerAddressLines.length * 4

  doc.setFillColor('#FFF3E8')
  doc.roundedRect(left, y, right - left, customerBoxHeight, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(muted)
  doc.text('BILL TO', left + 5, y + 7)
  doc.setFontSize(10)
  doc.setTextColor(ink)
  doc.text(customerNameLines, left + 5, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(muted)
  const phoneY = y + 13 + customerNameLines.length * 4 + 2
  doc.text(`Mobile Number: ${customerPhone}`, left + 5, phoneY)
  if (customerAddressLines.length > 0) {
    doc.text(customerAddressLines, left + 5, phoneY + 5)
  }
  y += customerBoxHeight + 9

  if (data.remarks?.trim()) {
    doc.setFillColor('#f8fafc')
    doc.roundedRect(left, y, right - left, 12, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(muted)
    doc.text('REMARKS', left + 5, y + 5)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(ink)
    doc.text(doc.splitTextToSize(data.remarks.trim(), 155) as string[], left + 5, y + 9)
    y += 16
  }

  if (data.eyePrescription && hasPrescriptionValues(data.eyePrescription)) {
    doc.setFillColor('#eef2f3')
    doc.roundedRect(left, y, right - left, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(primaryColor)
    doc.text('EYE PRESCRIPTION', left + 5, y + 5)
    y += 12
    const rows = [
      ['Vision', 'OD SPH', 'OD CYL', 'OD AXIS', 'OD Vn', 'OS SPH', 'OS CYL', 'OS AXIS', 'OS Vn', 'PD', 'Lens'],
      ['Distance', data.eyePrescription.distance.od.sph, data.eyePrescription.distance.od.cyl, data.eyePrescription.distance.od.axis, data.eyePrescription.distance.od.vn, data.eyePrescription.distance.os.sph, data.eyePrescription.distance.os.cyl, data.eyePrescription.distance.os.axis, data.eyePrescription.distance.os.vn, data.eyePrescription.distance.pd, data.eyePrescription.distance.lensType],
      ['Near', data.eyePrescription.near.od.sph, data.eyePrescription.near.od.cyl, data.eyePrescription.near.od.axis, data.eyePrescription.near.od.vn, data.eyePrescription.near.os.sph, data.eyePrescription.near.os.cyl, data.eyePrescription.near.os.axis, data.eyePrescription.near.os.vn, data.eyePrescription.near.pd, data.eyePrescription.near.lensType],
    ]
    const columnWidth = (right - left) / rows[0].length
    rows.forEach((row, index) => {
      row.forEach((value, column) => {
        doc.setFillColor(index === 0 ? '#f8fafb' : '#ffffff')
        doc.rect(left + column * columnWidth, y, columnWidth, 7, 'F')
        doc.setDrawColor('#d8dde2'); doc.rect(left + column * columnWidth, y, columnWidth, 7)
        doc.setFont('helvetica', index === 0 || column === 0 ? 'bold' : 'normal'); doc.setFontSize(5.5); doc.setTextColor(ink)
        doc.text(String(value || '-'), left + column * columnWidth + columnWidth / 2, y + 4.5, { align: 'center', maxWidth: columnWidth - 1 })
      })
      y += 7
    })
    y += 5
  }

  doc.setFillColor(primaryColor)
  doc.rect(left, y, right - left, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor('#ffffff')
  doc.text('#', left + 4, y + 6)
  doc.text('ITEM DESCRIPTION', left + 14, y + 6)
  doc.text('QTY', 140, y + 6, { align: 'right' })
  doc.text('RATE', 166, y + 6, { align: 'right' })
  doc.text('AMOUNT', right - 4, y + 6, { align: 'right' })
  y += 14

  data.items.forEach((raw, index) => {
    const item = normalizeStructuredOrderItem(raw)
    if (y > 260) { doc.addPage(); y = 20 }
    const name = item.name || 'Item'
    const nameLines = doc.splitTextToSize(name, 105) as string[]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(ink)
    doc.text(String(index + 1), left + 4, y)
    doc.text(nameLines, left + 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(muted)
    doc.text(`${formatQuantityDisplay(item.quantity, item.unit, item.unit_type)}`, 140, y, { align: 'right' })
    doc.text(money(item.base_price), 166, y, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(ink)
    doc.text(money(item.line_total), right - 4, y, { align: 'right' })
    y += Math.max(10, nameLines.length * 4 + 4)
    doc.setDrawColor('#e8eaed')
    doc.line(left, y - 3, right, y - 3)
  })

  y = Math.max(y + 6, 150)
  const rows: Array<[string, string, string]> = [['Subtotal', money(data.subtotal), ink]]
  if ((data.discountAmount || 0) > 0) rows.push([`Coupon${data.couponCode ? ` (${data.couponCode})` : ''}`, `-${money(data.discountAmount || 0)}`, '#3B261B'])
  if ((data.manualDiscountAmount || 0) > 0) rows.push(['Discount', `-${money(data.manualDiscountAmount || 0)}`, '#3B261B'])
  if ((data.gstAmount || 0) > 0) rows.push(['SST', money(data.gstAmount || 0), ink])
  rows.push(['Delivery', (data.shipping || 0) > 0 ? money(data.shipping) : 'FREE', ink])
  doc.setFontSize(9)
  rows.forEach(([label, value, color]) => { doc.setFont('helvetica', 'normal'); doc.setTextColor(color); doc.text(label, 143, y, { align: 'right' }); doc.text(value, right - 4, y, { align: 'right' }); y += 7 })
  doc.setDrawColor(primaryColor)
  doc.setLineWidth(0.7)
  doc.line(118, y - 3, right, y - 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(primaryColor)
  doc.text('TOTAL', 143, y + 6, { align: 'right' })
  doc.text(money(data.total), right - 4, y + 6, { align: 'right' })

  y = 275
  doc.setDrawColor('#d8dce0')
  doc.setLineWidth(0.2)
  doc.line(left, y, right, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(primaryColor)
  doc.text('THANK YOU FOR SHOPPING WITH US', pageWidth / 2, y + 8, { align: 'center' })
  return doc.output('blob')
}

export function invoicePdfFile(data: InvoicePdfData): File {
  return new File([createInvoicePdf(data)], `Invoice-${formatInvoiceNo(data.invoiceNo)}.pdf`, { type: 'application/pdf' })
}

/** Captures the rendered invoice so the downloaded PDF matches the visible view. */
export async function invoicePdfFileFromElement(
  element: HTMLElement,
  invoiceNo: string,
): Promise<File> {
  const formattedNo = formatInvoiceNo(invoiceNo)
  await document.fonts?.ready
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = 210
  const pageHeight = 297
  const imageHeight = (canvas.height * pageWidth) / canvas.width
  const image = canvas.toDataURL('image/png')

  if (imageHeight <= pageHeight + 10) {
    doc.addImage(image, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, imageHeight), undefined, 'FAST')
  } else {
    let offset = 0
    let page = 0
    while (offset < imageHeight) {
      if (page > 0) doc.addPage()
      doc.addImage(image, 'PNG', 0, -offset, pageWidth, imageHeight, undefined, 'FAST')
      offset += pageHeight
      page += 1
    }
  }

  return new File([doc.output('blob')], `Invoice-${formattedNo}.pdf`, { type: 'application/pdf' })
}
