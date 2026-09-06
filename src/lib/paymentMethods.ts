export const PAYMENT_METHODS = [
  'Cash',
  'GPay',
  'Card',
] as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[number];
