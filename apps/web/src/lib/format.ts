/** 150000 → "150 000 ₸" */
export const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("ru-RU").format(price)} ₸`;
