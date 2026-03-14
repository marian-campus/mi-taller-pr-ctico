-- 1. Perfiles de Usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  business_name TEXT,
  business_category TEXT,
  hourly_rate NUMERIC DEFAULT 0,
  monthly_salary NUMERIC DEFAULT 0,
  monthly_working_hours NUMERIC DEFAULT 0,
  currency_symbol TEXT DEFAULT '$',
  start_date DATE DEFAULT CURRENT_DATE,
  location TEXT,
  country TEXT,
  language TEXT DEFAULT 'es',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insumos y Materiales
CREATE TABLE supplies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_bought NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_paid NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  labor_hours NUMERIC DEFAULT 0,
  labor_minutes NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  services_hours NUMERIC DEFAULT 0,
  services_minutes NUMERIC DEFAULT 0,
  services_cost NUMERIC DEFAULT 0,
  estimated_units_per_month NUMERIC DEFAULT 1,
  include_fixed_costs BOOLEAN DEFAULT FALSE,
  fixed_cost_per_unit NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL,
  selling_price NUMERIC,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ingredientes de Productos
CREATE TABLE product_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  supply_id UUID REFERENCES supplies(id) ON DELETE RESTRICT NOT NULL,
  quantity_used NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  is_packaging BOOLEAN DEFAULT FALSE
);

-- 5. Gastos
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  included_in_fixed_costs BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Profiles are viewable by owner" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are updatable by owner" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are insertable by owner" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Supplies are manageable by owner" ON supplies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Products are manageable by owner" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ingredients are manageable by owner" ON product_ingredients FOR ALL 
  USING (EXISTS (SELECT 1 FROM products WHERE id = product_ingredients.product_id AND user_id = auth.uid()));
CREATE POLICY "Expenses are manageable by owner" ON expenses FOR ALL USING (auth.uid() = user_id);
