export const SHIPPING_PACZKOMAT = 19;
export const SHIPPING_KURIER = 21;
export const FREE_SHIPPING_THRESHOLD = 500;

export function shippingCostFor(method: 'paczkomat' | 'kurier', cartValue: number): number {
  if (cartValue >= FREE_SHIPPING_THRESHOLD) return 0;
  return method === 'paczkomat' ? SHIPPING_PACZKOMAT : SHIPPING_KURIER;
}
