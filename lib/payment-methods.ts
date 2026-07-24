export const paymentMethods = [
  {
    code: 'telebirr',
    name: 'telebirr',
    shortLabel: 'telebirr',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/tele_birr/tele_birr.svg',
    description: 'Pay from a telebirr wallet'
  },
  {
    code: 'mpesa',
    name: 'M-PESA',
    shortLabel: 'M-PESA',
    source: 'https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg',
    description: 'Pay from M-PESA Ethiopia'
  },
  {
    code: 'cbe_birr',
    name: 'CBE Birr',
    shortLabel: 'CBE Birr',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/cbe_birr_light/cbe_birr_light.svg',
    description: 'Pay from CBE Birr'
  },
  {
    code: 'amole',
    name: 'Amole',
    shortLabel: 'Amole',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/amole/amole.svg',
    description: 'Pay from an Amole wallet'
  },
  {
    code: 'kacha',
    name: 'Kacha',
    shortLabel: 'Kacha',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/kacha/kacha.svg',
    description: 'Pay from a Kacha wallet'
  },
  {
    code: 'chapa',
    name: 'Chapa',
    shortLabel: 'Cards & banks',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/chapa/chapa.svg',
    description: 'Cards, bank channels and other methods available in Chapa'
  }
] as const;

export type PaymentMethodCode = typeof paymentMethods[number]['code'];

const paymentMethodCodes = new Set<string>(paymentMethods.map((method) => method.code));

export function isPaymentMethodCode(value: unknown): value is PaymentMethodCode {
  return typeof value === 'string' && paymentMethodCodes.has(value);
}

export function getPaymentMethod(code: PaymentMethodCode) {
  return paymentMethods.find((method) => method.code === code) ?? paymentMethods[0];
}
