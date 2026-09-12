export const PAYMENT_METHODS = [
  'Cash',
  'QR',
  'Card',
] as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[number];
