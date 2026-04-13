export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
};
