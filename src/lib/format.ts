export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount);
  return '$' + rounded.toLocaleString('es-AR');
};
