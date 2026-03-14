export const baseUnits = {
    WEIGHT: 'kg',
    VOLUME: 'L',
    UNIT: 'unidades',
} as const;

export const unitConversions: Record<string, { base: string; factor: number }> = {
    'kg': { base: 'kg', factor: 1 },
    'g': { base: 'kg', factor: 0.001 },
    'L': { base: 'L', factor: 1 },
    'ml': { base: 'L', factor: 0.001 },
    'unidades': { base: 'unidades', factor: 1 },
};

export const getBaseUnit = (unit: string): string => {
    return unitConversions[unit]?.base || unit;
};

export const getNormalizationFactor = (unit: string): number => {
    return unitConversions[unit]?.factor || 1;
};

export const normalizeQuantity = (quantity: number, unit: string): { quantity: number; unit: string } => {
    const conv = unitConversions[unit];
    if (!conv) return { quantity, unit };
    return {
        quantity: quantity * conv.factor,
        unit: conv.base,
    };
};
