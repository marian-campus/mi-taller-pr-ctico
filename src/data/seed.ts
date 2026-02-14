import { Supply, Product, Expense, UserSettings } from '@/types';

export const defaultSettings: UserSettings = {
  name: 'Maru',
  businessName: 'Dulces de Maru',
  businessCategory: 'gastronomia',
  startDate: '2024-03-01',
  location: 'Ciudad de Buenos Aires',
  hourlyRate: 4000,
  electricityCostPerHour: 300,
  gasCostPerHour: 200,
  waterCostPerLiter: 50,
  fixedCosts: [
    { name: 'Alquiler', amount: 20000 },
    { name: 'Servicios', amount: 5000 },
  ],
  transportMode: 'per-trip',
  transportPercentage: 5,
};

export const seedSupplies: Supply[] = [
  // Gastronomía
  { id: 's1', name: 'Harina 0000', category: 'gastronomia', quantityBought: 1, unit: 'kg', pricePaid: 450, pricePerUnit: 450 },
  { id: 's2', name: 'Azúcar', category: 'gastronomia', quantityBought: 1, unit: 'kg', pricePaid: 500, pricePerUnit: 500 },
  { id: 's3', name: 'Huevos', category: 'gastronomia', quantityBought: 12, unit: 'unidades', pricePaid: 1080, pricePerUnit: 90 },
  { id: 's4', name: 'Manteca', category: 'gastronomia', quantityBought: 500, unit: 'g', pricePaid: 600, pricePerUnit: 1.2 },
  { id: 's5', name: 'Levadura', category: 'gastronomia', quantityBought: 500, unit: 'g', pricePaid: 800, pricePerUnit: 1.6 },
  { id: 's6', name: 'Cacao', category: 'gastronomia', quantityBought: 200, unit: 'g', pricePaid: 900, pricePerUnit: 4.5 },
  { id: 's7', name: 'Esencia de Vainilla', category: 'gastronomia', quantityBought: 100, unit: 'ml', pricePaid: 350, pricePerUnit: 3.5 },
  { id: 's8', name: 'Manzanas', category: 'gastronomia', quantityBought: 6, unit: 'unidades', pricePaid: 900, pricePerUnit: 150 },
  // Indumentaria
  { id: 's9', name: 'Tela de algodón', category: 'indumentaria', quantityBought: 1, unit: 'm', pricePaid: 3500, pricePerUnit: 3500 },
  { id: 's10', name: 'Hilo', category: 'indumentaria', quantityBought: 100, unit: 'm', pricePaid: 400, pricePerUnit: 4 },
  { id: 's11', name: 'Botones', category: 'indumentaria', quantityBought: 10, unit: 'unidades', pricePaid: 300, pricePerUnit: 30 },
  { id: 's12', name: 'Cierres', category: 'indumentaria', quantityBought: 1, unit: 'unidades', pricePaid: 350, pricePerUnit: 350 },
  { id: 's13', name: 'Etiquetas', category: 'indumentaria', quantityBought: 100, unit: 'unidades', pricePaid: 2000, pricePerUnit: 20 },
  // Packaging
  { id: 's14', name: 'Cajas de cartón', category: 'packaging', quantityBought: 10, unit: 'unidades', pricePaid: 1200, pricePerUnit: 120 },
  { id: 's15', name: 'Bolsas kraft', category: 'packaging', quantityBought: 50, unit: 'unidades', pricePaid: 1500, pricePerUnit: 30 },
  { id: 's16', name: 'Cintas', category: 'packaging', quantityBought: 10, unit: 'm', pricePaid: 500, pricePerUnit: 50 },
  { id: 's17', name: 'Etiquetas adhesivas', category: 'packaging', quantityBought: 100, unit: 'unidades', pricePaid: 800, pricePerUnit: 8 },
  { id: 's18', name: 'Papel de regalo', category: 'packaging', quantityBought: 5, unit: 'm', pricePaid: 750, pricePerUnit: 150 },
];

export const seedProducts: Product[] = [
  {
    id: 'p1',
    name: 'Torta de Manzana',
    category: 'gastronomia',
    ingredients: [
      { id: 'i1', supplyId: 's1', name: 'Harina 0000', quantityUsed: 0.2, unit: 'kg', cost: 90 },
      { id: 'i2', supplyId: 's2', name: 'Azúcar', quantityUsed: 0.15, unit: 'kg', cost: 75 },
      { id: 'i3', supplyId: 's3', name: 'Huevos', quantityUsed: 2, unit: 'unidades', cost: 180 },
      { id: 'i4', supplyId: 's4', name: 'Manteca', quantityUsed: 100, unit: 'g', cost: 120 },
      { id: 'i5', supplyId: 's8', name: 'Manzanas', quantityUsed: 3, unit: 'unidades', cost: 450 },
    ],
    packaging: [
      { id: 'pk1', supplyId: 's14', name: 'Caja tortera', quantityUsed: 1, unit: 'unidades', cost: 120 },
    ],
    services: { hours: 1, minutes: 30, cost: 300 },
    labor: { hours: 2, minutes: 30, cost: 10000 },
    includeFixedCosts: false,
    estimatedUnitsPerMonth: 10,
    fixedCostPerUnit: 0,
    totalCost: 11335,
    sellingPrice: 17000,
    createdAt: '2026-02-01',
  },
];

export const seedExpenses: Expense[] = [
  { id: 'e1', description: 'Nafta para comprar ingredientes', category: 'transporte', amount: 2000, date: '2026-02-10', paymentMethod: 'efectivo', recurring: false },
  { id: 'e2', description: 'Publicidad en Instagram', category: 'publicidad', amount: 5000, date: '2026-02-05', paymentMethod: 'transferencia', recurring: true },
  { id: 'e3', description: 'Alquiler del local', category: 'alquiler', amount: 20000, date: '2026-02-01', paymentMethod: 'transferencia', recurring: true },
  { id: 'e4', description: 'Bolsas y cajas', category: 'otros', amount: 1500, date: '2026-02-08', paymentMethod: 'efectivo', recurring: false },
];
