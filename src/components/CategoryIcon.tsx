const categoryEmojis: Record<string, string> = {
  gastronomia: '🍰',
  indumentaria: '👗',
  cosmetica: '💄',
  artesanias: '🎨',
  servicios: '💼',
  otros: '📦',
  transporte: '🚗',
  publicidad: '📱',
  alquiler: '🏢',
  limpieza: '🧹',
  capacitacion: '📚',
  comisiones: '🏦',
  tramites: '📄',
  muestras: '🎁',
  packaging: '📦',
};

export default function CategoryIcon({ category, className }: { category: string; className?: string }) {
  return <span className={className}>{categoryEmojis[category] || '📦'}</span>;
}

export { categoryEmojis };
