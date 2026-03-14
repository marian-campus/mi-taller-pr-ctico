import { Supply, Product, Expense, UserSettings } from '@/types';

export const defaultSettings: UserSettings = {
  id: 'default-user',
  name: 'Maru',
  businessName: 'Dulces de Maru',
  businessCategory: 'gastronomia',
  startDate: '2024-03-01',
  location: 'Ciudad de Buenos Aires',
  hourlyRate: 4000,
  monthlySalary: 640000,
  monthlyWorkingHours: 160,
  country: 'Argentina',
  currencySymbol: '$',
  language: 'es-AR',
};

export const seedSupplies: Supply[] = [];

export const seedProducts: Product[] = [];

export const seedExpenses: Expense[] = [];
