export interface Supply {
  id: string;
  name: string;
  category: string;
  quantityBought: number;
  unit: string;
  pricePaid: number;
  pricePerUnit: number;
}

export interface RecipeIngredient {
  id: string;
  supplyId: string;
  name: string;
  quantityUsed: number;
  unit: string;
  cost: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  ingredients: RecipeIngredient[];
  packaging: RecipeIngredient[];
  services: { hours: number; minutes: number; cost: number };
  labor: { hours: number; minutes: number; cost: number };
  includeFixedCosts: boolean;
  estimatedUnitsPerMonth: number;
  fixedCostPerUnit: number;
  totalCost: number;
  sellingPrice?: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  recurring: boolean;
}

export interface UserSettings {
  name: string;
  businessName: string;
  businessCategory: string;
  startDate: string;
  location: string;
  hourlyRate: number;
  electricityCostPerHour: number;
  gasCostPerHour: number;
  waterCostPerLiter: number;
  fixedCosts: { name: string; amount: number }[];
  transportMode: 'per-trip' | 'percentage';
  transportPercentage: number;
}
