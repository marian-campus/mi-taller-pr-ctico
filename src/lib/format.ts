export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  const rounded = Math.round(amount);
  return symbol + ' ' + rounded.toLocaleString('es-AR');
};
