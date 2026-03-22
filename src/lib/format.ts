export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  return symbol + ' ' + amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
