import { supabase } from './supabase';
import { Supply, Product, Expense, UserSettings } from '@/types';

export const dataService = {
    // Profiles
    // Perfiles con mapeo de snake_case a camelCase
    async getProfile(userId: string): Promise<UserSettings | null> {
        console.log('🔍 Fetching profile for:', userId);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Supabase error in getProfile:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        return this.mapProfile(data);
    },

    mapProfile(data: Record<string, unknown>): UserSettings {
        return {
            id: data.id as string,
            name: (data.name as string) || 'Usuario',
            businessName: data.business_name || 'Mi Negocio',
            businessCategory: data.business_category || 'gastronomia',
            startDate: data.start_date || new Date().toISOString().split('T')[0],
            location: data.location || '',
            hourlyRate: Number(data.hourly_rate) || 0,
            monthlySalary: Number(data.monthly_salary) || 0,
            monthlyWorkingHours: Number(data.monthly_working_hours) || 0,
            country: data.country || '',
            currencySymbol: data.currency_symbol || '$',
            language: data.language || 'es'
        } as UserSettings;
    },

    async createProfile(profile: UserSettings & { id: string }) {
        console.log('Upserting profile for user:', profile.id);
        // Fully defensive payload: Only include the most basic fields first
        const payload: Record<string, unknown> = {
            id: profile.id,
            name: profile.name || 'Usuario'
        };

        // Add optional fields only if they exist in the object provided
        // This prevents PGRST204 errors if the columns are missing in Supabase
        if (profile.businessName) payload.business_name = profile.businessName;
        if (profile.businessCategory) payload.business_category = profile.businessCategory;
        if (profile.startDate) payload.start_date = profile.startDate;
        if (profile.location) payload.location = profile.location;
        if (profile.hourlyRate !== undefined) payload.hourly_rate = Number(profile.hourlyRate);
        if (profile.monthlySalary !== undefined) payload.monthly_salary = Number(profile.monthlySalary);
        if (profile.monthlyWorkingHours !== undefined) payload.monthly_working_hours = Number(profile.monthlyWorkingHours);
        if (profile.currencySymbol) payload.currency_symbol = profile.currencySymbol;
        if (profile.language) payload.language = profile.language;
        if (profile.country) payload.country = profile.country;


        const { data, error } = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('❌ Supabase error in createProfile/upsert:', error.message, error.details, error.hint, error.code);
            console.error('Payload attempted:', payload);
            
            // Intento desesperado: solo ID y Nombre
            console.warn('⚠️ Attempting minimal profile creation...');
            const minimalPayload = { id: profile.id, name: profile.name || 'Usuario' };
            const { data: minData, error: minError } = await supabase
                .from('profiles')
                .upsert(minimalPayload, { onConflict: 'id' })
                .select();

            if (minError) {
                console.error('❌ Minimal profile creation also failed:', minError.message, minError.code);
                throw minError;
            }
            return minData ? minData[0] : null;
        }
        return data ? data[0] : null;
    },

    async updateProfile(userId: string, profile: Partial<UserSettings>) {
        const payload: Record<string, unknown> = {};
        if (profile.name !== undefined) payload.name = profile.name;
        if (profile.businessName !== undefined) payload.business_name = profile.businessName;
        if (profile.businessCategory !== undefined) payload.business_category = profile.businessCategory;
        if (profile.startDate !== undefined) payload.start_date = profile.startDate;
        if (profile.location !== undefined) payload.location = profile.location;
        if (profile.hourlyRate !== undefined) payload.hourly_rate = profile.hourlyRate;
        if (profile.monthlySalary !== undefined) payload.monthly_salary = profile.monthlySalary;
        if (profile.monthlyWorkingHours !== undefined) payload.monthly_working_hours = profile.monthlyWorkingHours;
        if (profile.country !== undefined) payload.country = profile.country;
        if (profile.currencySymbol !== undefined) payload.currency_symbol = profile.currencySymbol;
        if (profile.language !== undefined) payload.language = profile.language;

        const { data, error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId);

        if (error) throw error;
        return data;
    },

    // Supplies
    async getSupplies(userId?: string) {
        let finalUserId = userId;
        if (!finalUserId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('No user logged in');
            finalUserId = authUser.id;
        }

        const { data, error } = await supabase
            .from('supplies')
            .select('*')
            .eq('user_id', finalUserId)
            .order('name');
        if (error) throw error;
        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            quantityBought: Number(s.quantity_bought),
            unit: s.unit,
            pricePaid: Number(s.price_paid),
            pricePerUnit: Number(s.price_per_unit)
        })) as Supply[];
    },

    async createSupply(supply: Omit<Supply, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            name: supply.name,
            category: supply.category,
            quantity_bought: supply.quantityBought,
            unit: supply.unit,
            price_paid: supply.pricePaid,
            price_per_unit: supply.pricePerUnit
        };
        const { data, error } = await supabase
            .from('supplies')
            .insert([payload])
            .select();
        if (error) throw error;
        const s = data[0];
        return {
            id: s.id,
            name: s.name,
            category: s.category,
            quantityBought: Number(s.quantity_bought),
            unit: s.unit,
            pricePaid: Number(s.price_paid),
            pricePerUnit: Number(s.price_per_unit)
        } as Supply;
    },

    async updateSupply(id: string, supply: Partial<Supply>) {
        const payload: Record<string, unknown> = {};
        if (supply.name !== undefined) payload.name = supply.name;
        if (supply.category !== undefined) payload.category = supply.category;
        if (supply.quantityBought !== undefined) payload.quantity_bought = supply.quantityBought;
        if (supply.unit !== undefined) payload.unit = supply.unit;
        if (supply.pricePaid !== undefined) payload.price_paid = supply.pricePaid;
        if (supply.pricePerUnit !== undefined) payload.price_per_unit = supply.pricePerUnit;

        const { data, error } = await supabase
            .from('supplies')
            .update(payload)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    async deleteSupply(id: string) {
        const { error } = await supabase
            .from('supplies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Products
    mapProduct(p: Record<string, unknown>): Product {
        return {
            id: p.id,
            name: p.name || 'Sin nombre',
            category: p.category || 'gastronomia',
            labor: {
                hours: Number(p.labor_hours) || 0,
                minutes: Number(p.labor_minutes) || 0,
                cost: Number(p.labor_cost) || 0
            },
            includeFixedCosts: p.include_fixed_costs || false,
            fixedCostPerUnit: Number(p.fixed_cost_per_unit) || 0,
            totalCost: Number(p.total_cost) || 0,
            sellingPrice: p.selling_price ? Number(p.selling_price) : undefined,
            active: p.active !== false,
            createdAt: p.created_at,
            ingredients: (p.ingredients || []).filter((i: Record<string, unknown>) => !i.is_packaging).map((i: Record<string, unknown>) => ({
                id: i.id,
                supplyId: i.supply_id,
                name: i.name || 'Ingrediente',
                quantityUsed: Number(i.quantity_used) || 0,
                unit: i.unit || 'un',
                cost: Number(i.cost) || 0
            })),
            packaging: (p.ingredients || []).filter((i: Record<string, unknown>) => i.is_packaging).map((i: Record<string, unknown>) => ({
                id: i.id,
                supplyId: i.supply_id,
                name: i.name || 'Envase',
                quantityUsed: Number(i.quantity_used) || 0,
                unit: i.unit || 'un',
                cost: Number(i.cost) || 0
            }))
        } as Product;
    },

    async getProducts(userId?: string) {
        let finalUserId = userId;
        if (!finalUserId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('No user logged in');
            finalUserId = authUser.id;
        }

        console.log('Fetching products...');
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        ingredients:product_ingredients(*)
      `)
            .eq('user_id', finalUserId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error in getProducts:', error);
            throw error;
        }

        const mapped = (data || []).map(p => this.mapProduct(p));
        console.log('Products mapped:', mapped.length);
        return mapped;
    },

    async createProduct(product: Partial<Product>, ingredients: Record<string, unknown>[], userId: string) {
        const payload: Record<string, unknown> = {
            user_id: userId,
            name: product.name,
            category: product.category,
            include_fixed_costs: product.includeFixedCosts,
            fixed_cost_per_unit: product.fixedCostPerUnit,
            total_cost: product.totalCost,
            selling_price: product.sellingPrice,
            active: product.active,
            estimated_units_per_month: product.estimatedUnitsPerMonth
        };

        if (product.labor) {
            payload.labor_hours = product.labor.hours;
            payload.labor_minutes = product.labor.minutes;
            payload.labor_cost = product.labor.cost;
        }

        if (product.services) {
            payload.services_hours = product.services.hours;
            payload.services_minutes = product.services.minutes;
            payload.services_cost = product.services.cost;
        }

        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .insert([payload])
            .select();

        if (prodError) throw prodError;
        const productId = prodData[0].id;

        if (ingredients.length > 0) {
            const ingsWithId = ingredients.map(i => ({
                product_id: productId,
                supply_id: i.supplyId,
                name: i.name,
                quantity_used: i.quantityUsed,
                unit: i.unit,
                cost: i.cost,
                is_packaging: !!i.isPackaging
            }));
            const { error: ingError } = await supabase
                .from('product_ingredients')
                .insert(ingsWithId);
            if (ingError) throw ingError;
        }

        // Fetch the created product with its ingredients to return a full Product object
        const { data: fullProduct, error: fetchError } = await supabase
            .from('products')
            .select(`
                *,
                ingredients:product_ingredients(*)
            `)
            .eq('id', productId)
            .single();

        if (fetchError) {
             console.error('Error fetching full product after creation:', fetchError);
             return prodData[0]; // Fallback to raw data
        }

        return this.mapProduct(fullProduct);
    },

    async updateProduct(id: string, product: Partial<Product>, ingredients?: Record<string, unknown>[]) {
        const payload: Record<string, unknown> = {};
        if (product.name !== undefined) payload.name = product.name;
        if (product.category !== undefined) payload.category = product.category;
        if (product.labor !== undefined) {
            payload.labor_hours = product.labor.hours;
            payload.labor_minutes = product.labor.minutes;
            payload.labor_cost = product.labor.cost;
        }
        if (product.includeFixedCosts !== undefined) payload.include_fixed_costs = product.includeFixedCosts;
        if (product.fixedCostPerUnit !== undefined) payload.fixed_cost_per_unit = product.fixedCostPerUnit;
        if (product.totalCost !== undefined) payload.total_cost = product.totalCost;
        if (product.sellingPrice !== undefined) payload.selling_price = product.sellingPrice;
        if (product.active !== undefined) payload.active = product.active;

        const { error: prodError } = await supabase
            .from('products')
            .update(payload)
            .eq('id', id);

        if (prodError) throw prodError;

        if (ingredients) {
            // Delete old ingredients and insert new ones (simpler than syncing)
            const { error: delError } = await supabase
                .from('product_ingredients')
                .delete()
                .eq('product_id', id);

             if (delError) {
                 console.error('❌ Supabase error deleting ingredients for update:', delError.message, delError.code);
                 throw delError;
             }

            if (ingredients.length > 0) {
                const ingsWithId = ingredients.map(i => ({
                    product_id: id,
                    supply_id: i.supplyId,
                    name: i.name,
                    quantity_used: i.quantityUsed,
                    unit: i.unit,
                    cost: i.cost,
                    is_packaging: !!i.isPackaging
                }));
                const { error: ingError } = await supabase
                    .from('product_ingredients')
                    .insert(ingsWithId);
                if (ingError) {
                 console.error('❌ Supabase error inserting product ingredients:', ingError.message, ingError.details, ingError.hint, ingError.code);
                 throw ingError;
             }
            }
        }
    },

    async deleteProduct(id: string) {
        // product_ingredients should be deleted by cascade if schema is correct, 
        // but we delete them manually just in case.
        await supabase.from('product_ingredients').delete().eq('product_id', id);
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Expenses
    async getExpenses(userId?: string) {
        let finalUserId = userId;
        if (!finalUserId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('No user logged in');
            finalUserId = authUser.id;
        }

        console.log('Fetching expenses...');
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', finalUserId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error in getExpenses:', error);
            throw error;
        }

        const mapped = (data || []).map(e => ({
            id: e.id,
            description: e.description || 'Gasto sin descripción',
            category: e.category || 'Otros',
            amount: Number(e.amount) || 0,
            date: e.date || new Date().toISOString().split('T')[0],
            includedInFixedCosts: e.included_in_fixed_costs !== false
        })) as Expense[];

        console.log('Expenses loaded:', mapped.length);
        return mapped;
    },

    async createExpense(expense: Omit<Expense, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            included_in_fixed_costs: expense.includedInFixedCosts
        };
        const { data, error } = await supabase
            .from('expenses')
            .insert([payload])
            .select();
        if (error) throw error;
        const e = data[0];
        return {
            id: e.id,
            description: e.description,
            category: e.category,
            amount: Number(e.amount),
            date: e.date,
            includedInFixedCosts: e.included_in_fixed_costs
        } as Expense;
    },

    async updateExpense(id: string, expense: Partial<Expense>) {
        const payload: Record<string, unknown> = {};
        if (expense.description !== undefined) payload.description = expense.description;
        if (expense.category !== undefined) payload.category = expense.category;
        if (expense.amount !== undefined) payload.amount = expense.amount;
        if (expense.date !== undefined) payload.date = expense.date;
        if (expense.includedInFixedCosts !== undefined) payload.included_in_fixed_costs = expense.includedInFixedCosts;

        const { error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteExpense(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
