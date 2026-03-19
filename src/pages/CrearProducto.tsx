import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RecipeIngredient, Product, Supply } from '@/types';
import { ArrowLeft, ArrowRight, Plus, X, Search, Check, Trash2, Clock, Package, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { categoryEmojis } from '@/components/CategoryIcon';

const productCategories = [
  { value: 'gastronomia', label: '🍰 Gastronomía' },
];

import { normalizeQuantity, getNormalizationFactor, getBaseUnit } from '@/lib/conversions';

const unitOptions = ['kg', 'g', 'L', 'ml', 'unidades'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            i + 1 < current ? 'bg-primary text-primary-foreground' :
              i + 1 === current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
          )}>
            {i + 1 < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && <div className={cn('w-6 h-0.5 mx-0.5', i + 1 < current ? 'bg-primary' : 'bg-muted')} />}
        </div>
      ))}
    </div>
  );
}

export default function CrearProducto() {
  const { supplies, addSupply, updateSupply, deleteSupply, addProduct, updateProduct, products, user, totalExpenses } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';

  const existing = id ? products.find(p => p.id === id) : null;

  const [step, setStep] = useState(isViewMode ? 5 : 1);

  // Step 1
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'gastronomia');

  // Step 2
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existing?.ingredients || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});

  // New supply form
  const [showNewSupply, setShowNewSupply] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('gastronomia');

  // Step 3
  const [packaging, setPackaging] = useState<(RecipeIngredient & { enabled?: boolean })[]>(existing?.packaging || []);
  const [usePackaging, setUsePackaging] = useState(existing ? (existing.packaging?.length > 0) : true);
  const [packSearch, setPackSearch] = useState('');
  const [packQty, setPackQty] = useState<Record<string, string>>({});
  const [includeFixed, setIncludeFixed] = useState(existing?.includeFixedCosts || false);
  const [estUnits, setEstUnits] = useState(existing?.estimatedUnitsPerMonth || 10);

  // Step 4
  const [labHours, setLabHours] = useState(existing?.labor?.hours || 0);
  const [labMinutes, setLabMinutes] = useState(existing?.labor?.minutes || 0);

  // Inline Detail Editing (Price Paid & Quantity Bought)
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [tempPP, setTempPP] = useState('');
  const [tempQB, setTempQB] = useState('');

  // Conditional returns MUST come after ALL useState/useMemo/useEffect/useCallback calls
  // If ID is provided but product not found, show error
  if (id && !existing) {
    return (
      <Layout title="Producto no encontrado">
        <div className="text-center py-20 px-4">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-muted-foreground">No pudimos encontrar el producto solicitado.</p>
          <Button onClick={() => navigate('/recetario')} className="mt-6">Volver al Recetario</Button>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Cargando tus datos...</p>
        </div>
      </Layout>
    );
  }

  // Calculations
  const ingCost = ingredients.reduce((s, i) => s + i.cost, 0);
  const packCost = usePackaging ? packaging.reduce((s, i) => s + (i.enabled !== false ? i.cost : 0), 0) : 0;

  // Labor
  const laborTimeHrs = labHours + labMinutes / 60;
  const labCost = laborTimeHrs * (user?.hourlyRate || 0);

  // Fixed Proportional Cost
  const hourlyFixedRate = user.monthlyWorkingHours > 0 ? totalExpenses / user.monthlyWorkingHours : 0;
  const fixedPU = includeFixed ? Math.round(hourlyFixedRate * laborTimeHrs) : 0;

  const totalCost = Math.round(ingCost + packCost + labCost + fixedPU);

  const filteredSupplies = useMemo(() =>
    supplies.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) && s.category !== 'packaging'),
    [supplies, searchTerm]
  );
  const filteredPack = useMemo(() =>
    supplies.filter(s => s.name.toLowerCase().includes(packSearch.toLowerCase()) && s.category === 'packaging'),
    [supplies, packSearch]
  );

  const addIng = (supply: Supply, target: 'ingredients' | 'packaging') => {
    const inputs = target === 'ingredients' ? qtyInputs : packQty;
    const qtyInput = parseFloat(inputs[supply.id] || '0');
    if (qtyInput <= 0) return;

    const usedUnit = selectedUnits[supply.id] || supply.unit;
    const factor = getNormalizationFactor(usedUnit);

    // supply.pricePerUnit is already normalized to its base unit
    const cost = Math.round(qtyInput * factor * supply.pricePerUnit * 100) / 100;

    const item = {
      id: 'ri-' + Date.now() + Math.random().toString(36).substr(2, 9),
      supplyId: supply.id,
      name: supply.name,
      quantityUsed: qtyInput,
      unit: usedUnit,
      cost,
    };

    if (target === 'ingredients') {
      setIngredients(prev => [...prev, item]);
      setQtyInputs(prev => ({ ...prev, [supply.id]: '' }));
    } else {
      setPackaging(prev => [...prev, { ...item, enabled: true }]);
      setPackQty(prev => ({ ...prev, [supply.id]: '' }));
    }
  };

  const updateItemQty = (id: string, newQtyValue: string, target: 'ingredients' | 'packaging') => {
    console.log(`🔄 updateItemQty called for ${id} with value: ${newQtyValue}`);
    const qty = parseFloat(newQtyValue) || 0;
    const setter = target === 'ingredients' ? setIngredients : setPackaging;

    setter(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const supply = supplies.find(s => s.id === item.supplyId);
      if (!supply) {
        console.warn(`⚠️ Supply not found for ID: ${item.supplyId} in ${target}`);
        // If we don't have the supply info, we still update the quantity
        // The cost will temporarily be wrong or 0 until supplies load, 
        // but it prevents the input from being "blocked"
        return { ...item, quantityUsed: qty };
      }

      const factor = getNormalizationFactor(item.unit);
      const cost = Math.round(qty * factor * supply.pricePerUnit * 100) / 100;
      
      console.log(`✅ Updated ${item.name}: Qty=${qty}, Cost=${cost}`);
      return { ...item, quantityUsed: qty, cost };
    }));
  };

  const handleDeleteSupply = (supplyId: string) => {
    const isInUse = products.some(p =>
      p.ingredients.some(i => i.supplyId === supplyId) ||
      p.packaging.some(i => i.supplyId === supplyId)
    );

    if (isInUse) {
      toast.error('Este insumo ya está siendo utilizado en productos existentes.');
      return;
    }

    if (window.confirm('¿Seguro que querés eliminar este insumo?')) {
      deleteSupply(supplyId);
      toast.success('Insumo eliminado');
    }
  };

  const existingSupplyMatch = useMemo(() =>
    supplies.find(s => s.name.trim().toLowerCase() === newName.trim().toLowerCase()),
    [supplies, newName]
  );

  const handleSupplyDetailBlur = (supply: Supply) => {
    const pp = parseFloat(tempPP);
    const qb = parseFloat(tempQB);
    if (!isNaN(pp) && pp > 0 && !isNaN(qb) && qb > 0) {
      const pricePerUnit = pp / qb;
      if (pp !== supply.pricePaid || qb !== supply.quantityBought) {
        updateSupply({ ...supply, pricePaid: pp, quantityBought: qb, pricePerUnit });
      }
    }
    setEditingSupplyId(null);
  };

  const handleDetailKeyDown = (e: React.KeyboardEvent, supply: Supply) => {
    if (e.key === 'Enter') handleSupplyDetailBlur(supply);
    if (e.key === 'Escape') setEditingSupplyId(null);
  };

  const saveNewSupply = () => {
    if (!newName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const qb = parseFloat(newQty);
    const pp = parseFloat(newPrice);

    if (isNaN(pp) || pp <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    if (isNaN(qb) || qb <= 0) {
      toast.error('La cantidad comprada debe ser mayor a 0');
      return;
    }

    const { quantity: qbNormalized, unit: baseUnit } = normalizeQuantity(qb, newUnit);
    const pricePerUnit = pp / qbNormalized;

    if (existingSupplyMatch) {
      const updatedSupply: Supply = {
        ...existingSupplyMatch,
        pricePaid: pp,
        quantityBought: qbNormalized,
        unit: baseUnit,
        pricePerUnit,
      };
      updateSupply(updatedSupply);
      toast.success(`¡Precio de ${existingSupplyMatch.name} actualizado!`);
    } else {
      const supply: Supply = {
        id: 'ns-' + Date.now(),
        name: newName.trim(),
        category: newCat,
        quantityBought: qbNormalized,
        unit: baseUnit,
        pricePaid: pp,
        pricePerUnit,
      };
      addSupply(supply);
      toast.success('¡Insumo guardado!');
    }

    if (newCat === 'packaging') setPackSearch(''); else setSearchTerm('');

    setShowNewSupply(false);
    setNewName(''); setNewQty(''); setNewPrice('');
  };

  const handleSave = async () => {
    try {
      const productData = {
        name,
        category,
        labor: {
          hours: labHours,
          minutes: labMinutes,
          cost: Math.round(labCost)
        },
        includeFixedCosts: includeFixed,
        fixedCostPerUnit: fixedPU,
        totalCost: totalCost,
        active: existing?.active ?? true,
      };

      const allIngredients = [
        ...ingredients.map(i => ({
          supplyId: i.supplyId,
          name: i.name,
          quantityUsed: i.quantityUsed,
          unit: i.unit,
          cost: i.cost,
          isPackaging: false
        })),
        ...packaging.filter(p => p.enabled !== false).map(p => ({
          supplyId: p.supplyId,
          name: p.name,
          quantityUsed: p.quantityUsed,
          unit: p.unit,
          cost: p.cost,
          isPackaging: true
        }))
      ];

      if (id && existing) {
        await updateProduct({ ...existing, ...productData } as Product, allIngredients);
        toast.success('🎯 ¡Producto actualizado!');
      } else {
        await addProduct(productData, allIngredients);
        toast.success('🎯 ¡Producto guardado!');
      }
      navigate('/recetario');
    } catch (err: any) {
      console.error("❌ Error saving product:", err);
      toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
    }
  };

  const emoji = categoryEmojis[category] || '📦';

  return (
    <Layout title={existing ? 'Editar Producto' : '📝 Nuevo Producto'}>
      <div className="max-w-lg mx-auto space-y-4">
        {step <= 4 && <StepIndicator current={step} total={4} />}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Información Básica</h2>
            <div>
              <Label>Nombre del producto *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Torta de Manzana" className="mt-1" />
            </div>
            <div>
              <Label>Categoría</Label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
                {productCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <Button onClick={() => { if (name.trim()) setStep(2); }} disabled={!name.trim()} className="w-full gap-2">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Ingredients */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Ingredientes / Materiales</h2>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar insumo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg">
              {filteredSupplies.map(s => {
                return (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {editingSupplyId === s.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            className="h-6 w-16 text-xs px-1"
                            value={tempPP}
                            onChange={e => setTempPP(e.target.value)}
                            onBlur={() => handleSupplyDetailBlur(s)}
                            onKeyDown={e => handleDetailKeyDown(e, s)}
                            autoFocus
                          />
                          <span className="text-xs text-muted-foreground">/</span>
                          <Input
                            type="number"
                            className="h-6 w-10 text-xs px-1"
                            value={tempQB}
                            onChange={e => setTempQB(e.target.value)}
                            onBlur={() => handleSupplyDetailBlur(s)}
                            onKeyDown={e => handleDetailKeyDown(e, s)}
                          />
                          <span className="text-xs text-muted-foreground">{s.unit}</span>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                          onClick={() => {
                            setEditingSupplyId(s.id);
                            setTempPP(s.pricePaid.toString());
                            setTempQB(s.quantityBought.toString());
                          }}
                        >
                          {formatCurrency(s.pricePaid, user.currencySymbol)} / {s.quantityBought} {s.unit}
                          <span className="text-xs font-bold text-primary ml-1">({formatCurrency(s.pricePerUnit, user.currencySymbol)} c/u)</span>
                          <span className="text-[10px] bg-muted px-1 rounded opacity-50">editar</span>
                        </p>
                      )}
                    </div>
                    <Input type="number" placeholder="Cant." className="w-16 h-8 text-sm"
                      value={qtyInputs[s.id] || ''}
                      onChange={e => setQtyInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                      min="0" step="any" />

                    <select
                      value={selectedUnits[s.id] || s.unit}
                      onChange={e => setSelectedUnits(prev => ({ ...prev, [s.id]: e.target.value }))}
                      className="h-8 rounded-md border border-input bg-background px-1 text-xs w-16"
                    >
                      {unitOptions.filter(u => getBaseUnit(u) === getBaseUnit(s.unit)).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>

                    <div className="flex gap-1.5 border-l pl-2 ml-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSupply(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => addIng(s, 'ingredients')}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" onClick={() => {
              setShowNewSupply(true);
              setNewCat(category);
              setNewUnit(category === 'gastronomia' ? 'kg' : 'unidades');
            }}>
              + Agregar Nuevo Insumo/Material
            </Button>

            {showNewSupply && newCat !== 'packaging' && (
              <Card className="p-3 space-y-2 border-primary border-2 mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">Nuevo Insumo</p>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewSupply(false)} className="h-6 w-6 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Cantidad comprada" value={newQty} onChange={e => setNewQty(e.target.value)} className="flex-1" />
                  <select value={newUnit} onChange={e => setNewUnit(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm w-28">
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <Input type="number" placeholder="Precio pagado ($)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={saveNewSupply} className="flex-1">
                    {existingSupplyMatch ? 'Actualizar' : 'Guardar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewSupply(false)} className="flex-1">Cancelar</Button>
                </div>
              </Card>
            )}


            {ingredients.length > 0 && (
              <Card className="p-3">
                <h3 className="text-sm font-semibold mb-2">📦 Insumos</h3>
                <div className="space-y-1">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <span className="text-sm flex-1 truncate">{ing.name}</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={ing.quantityUsed || ''}
                          onChange={e => updateItemQty(ing.id, e.target.value, 'ingredients')}
                          className="w-16 h-7 text-xs px-1 text-center"
                          step="any"
                        />
                        <span className="text-[10px] text-muted-foreground">{ing.unit}</span>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap w-20 text-right">{formatCurrency(ing.cost, user.currencySymbol)}</span>
                      <button onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))} className="text-destructive shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 font-semibold text-sm border-t mt-2">
                  <span>Materias Primas</span>
                  <span className="text-primary">{formatCurrency(ingCost, user.currencySymbol)}</span>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1 gap-2">
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Indirect Costs */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Costos Indirectos</h2>

            {/* Fixed Costs (moved to step 3 as requested) */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg leading-tight">🏠 Costos Indirectos</h3>
                  <p className="text-xs text-muted-foreground">Proporcional de tus gastos fijos mensuales.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch checked={includeFixed} onCheckedChange={setIncludeFixed} className="scale-75 origin-right" />
                  <span className={cn("text-[9px] font-black uppercase tracking-tighter", includeFixed ? "text-primary" : "text-muted-foreground")}>
                    {includeFixed ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              {includeFixed && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tasa por hora (Gastos / {user.monthlyWorkingHours}hs)</span>
                    <span className="font-medium">{formatCurrency(hourlyFixedRate, user.currencySymbol)}/h</span>
                  </div>
                  <div className="flex justify-between text-sm items-center border-t pt-2">
                    <span className="font-semibold">Costo Fijo Proporcional</span>
                    <span className="text-primary font-bold text-lg">{formatCurrency(fixedPU, user.currencySymbol)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight italic">
                    * Se calcula automáticamente según el tiempo de producción ingresado en el siguiente paso.
                  </p>
                </div>
              )}
            </Card>

            {/* Packaging */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">📦 Packaging</h3>
                <div className="flex flex-col items-end gap-1">
                  <Switch checked={usePackaging} onCheckedChange={setUsePackaging} className="scale-75 origin-right" />
                  <span className={cn("text-[9px] font-black uppercase tracking-tighter", usePackaging ? "text-primary" : "text-muted-foreground")}>
                    {usePackaging ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              {usePackaging && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Buscar packaging..." value={packSearch} onChange={e => setPackSearch(e.target.value)} />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredPack.map(s => {
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            {editingSupplyId === s.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  className="h-6 w-16 text-xs px-1"
                                  value={tempPP}
                                  onChange={e => setTempPP(e.target.value)}
                                  onBlur={() => handleSupplyDetailBlur(s)}
                                  onKeyDown={e => handleDetailKeyDown(e, s)}
                                  autoFocus
                                />
                                <span className="text-xs text-muted-foreground">/</span>
                                <Input
                                  type="number"
                                  className="h-6 w-10 text-xs px-1"
                                  value={tempQB}
                                  onChange={e => setTempQB(e.target.value)}
                                  onBlur={() => handleSupplyDetailBlur(s)}
                                  onKeyDown={e => handleDetailKeyDown(e, s)}
                                />
                                <span className="text-xs text-muted-foreground">{s.unit}</span>
                              </div>
                            ) : (
                              <p
                                className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                                onClick={() => {
                                  setEditingSupplyId(s.id);
                                  setTempPP(s.pricePaid.toString());
                                  setTempQB(s.quantityBought.toString());
                                }}
                              >
                                {formatCurrency(s.pricePaid, user.currencySymbol)} / {s.quantityBought} {s.unit}
                                <span className="text-xs font-bold text-primary ml-1">({formatCurrency(s.pricePerUnit, user.currencySymbol)} c/u)</span>
                                <span className="text-[10px] bg-muted px-1 rounded opacity-50">editar</span>
                              </p>
                            )}
                          </div>
                          <Input type="number" placeholder="Cant." className="w-16 h-8 text-sm"
                            value={packQty[s.id] || ''}
                            onChange={e => setPackQty(prev => ({ ...prev, [s.id]: e.target.value }))}
                            min="0" step="any" />

                          <select
                            value={selectedUnits[s.id] || s.unit}
                            onChange={e => setSelectedUnits(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="h-8 rounded-md border border-input bg-background px-1 text-xs w-16"
                          >
                            {unitOptions.filter(u => getBaseUnit(u) === getBaseUnit(s.unit)).map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>

                          <div className="flex gap-1.5 border-l pl-2 ml-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSupply(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => addIng(s, 'packaging')}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => { setShowNewSupply(true); setNewCat('packaging'); setNewUnit('unidades'); }}>
                    + Agregar Nuevo Packaging
                  </Button>

                  {showNewSupply && newCat === 'packaging' && (
                    <Card className="p-3 space-y-2 border-primary border-2 mt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Nuevo Packaging</p>
                        <Button size="sm" variant="ghost" onClick={() => setShowNewSupply(false)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Cantidad comprada" value={newQty} onChange={e => setNewQty(e.target.value)} className="flex-1" />
                        <select value={newUnit} onChange={e => setNewUnit(e.target.value)}
                          className="h-10 rounded-md border border-input bg-background px-2 text-sm w-28">
                          {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <Input type="number" placeholder="Precio pagado ($)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={saveNewSupply} className="flex-1">
                          {existingSupplyMatch ? 'Actualizar' : 'Guardar'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewSupply(false)} className="flex-1">Cancelar</Button>
                      </div>
                    </Card>
                  )}

                  {packaging.length > 0 && (
                    <div className="space-y-1 pt-2 border-t">
                      {packaging.map(p => (
                        <div key={p.id} className={cn("flex items-center justify-between text-sm py-1 border-b border-border last:border-0", p.enabled === false && "opacity-50")}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex flex-col items-center gap-0.5">
                              <Switch
                                checked={p.enabled !== false}
                                onCheckedChange={(checked) => {
                                  setPackaging(prev => prev.map(item => item.id === p.id ? { ...item, enabled: checked } : item));
                                }}
                                className="scale-75"
                              />
                              <span className={cn("text-[8px] font-black uppercase tracking-tighter", p.enabled !== false ? "text-primary" : "text-muted-foreground")}>
                                {p.enabled !== false ? 'ON' : 'OFF'}
                              </span>
                            </div>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-1 mx-2">
                            <Input
                              type="number"
                              value={p.quantityUsed || ''}
                              onChange={e => updateItemQty(p.id, e.target.value, 'packaging')}
                              className="w-14 h-7 text-xs px-1 text-center"
                              step="any"
                            />
                            <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                          </div>
                          <span className="font-medium mx-2 shrink-0 w-16 text-right">{formatCurrency(p.cost)}</span>
                          <button onClick={() => setPackaging(prev => prev.filter(i => i.id !== p.id))} className="text-destructive shrink-0 p-1">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <p className="font-medium text-primary text-sm mt-2">Packaging: {formatCurrency(packCost, user.currencySymbol)}</p>
                    </div>
                  )}
                </>
              )}
            </Card>


            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1 gap-2">
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Labor */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tu Tiempo</h2>
            <Card className="p-4 bg-accent rounded-xl">
              <p className="text-sm text-accent-foreground">💡 Tu tiempo es tu recurso más valioso. No regales tu esfuerzo.</p>
            </Card>

            <div>
              <Label>Tiempo de producción</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input type="number" placeholder="0" value={labHours || ''} onChange={e => setLabHours(parseInt(e.target.value) || 0)} className="w-20" min="0" />
                <span className="text-sm text-muted-foreground">hs</span>
                <Input type="number" placeholder="0" value={labMinutes || ''} onChange={e => setLabMinutes(parseInt(e.target.value) || 0)} className="w-20" min="0" max="59" />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Tu valor/hora: <span className="font-bold text-foreground">{formatCurrency(user.hourlyRate, user.currencySymbol)}</span></p>
              <p className="text-xl font-bold text-primary mt-1">Costo de tu trabajo: {formatCurrency(labCost, user?.currencySymbol || '$')}</p>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button onClick={() => setStep(5)} className="flex-1 gap-2">
                Ver Resultado <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Result / View Mode */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Resumen de Costos</h2>
              {isViewMode && (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/recetario/${id}`)} className="text-primary font-bold">
                  Editar Producto
                </Button>
              )}
            </div>

            <Card className="p-6 space-y-4 rounded-3xl shadow-xl border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl">{emoji}</span>
              </div>

              <div className="relative">
                <h3 className="text-2xl font-black text-foreground">{name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Análisis de producción</p>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Materias Primas</span>
                  </div>
                  <span className="font-bold">{formatCurrency(ingCost, user.currencySymbol)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Packaging</span>
                  </div>
                  <span className="font-bold">{formatCurrency(packCost, user.currencySymbol)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium block leading-tight">Mano de Obra</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{labHours}h {labMinutes}min dedicados</span>
                    </div>
                  </div>
                  <span className="font-bold">{formatCurrency(labCost, user?.currencySymbol || '$')}</span>
                </div>

                {includeFixed && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-accent/30 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Costo Fijo Proporcional</span>
                    </div>
                    <span className="font-bold">{formatCurrency(fixedPU, user.currencySymbol)}</span>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t border-dashed border-border flex justify-between items-end">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Costo Final por Unidad</p>
                    <p className="text-4xl font-black text-primary tracking-tighter">
                      {formatCurrency(totalCost, user.currencySymbol)}
                    </p>
                  </div>
                  {existing?.sellingPrice && existing.sellingPrice > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Precio de Venta</p>
                      <p className="text-xl font-bold text-cta">
                        {formatCurrency(existing.sellingPrice, user.currencySymbol)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-3 pt-4">
              <Button onClick={handleSave} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                {existing ? 'Actualizar Producto' : 'Guardar Producto'}
              </Button>
              <Button variant="cta" onClick={() => { handleSave(); navigate('/precio-justo'); }} className="w-full h-14 text-lg font-bold rounded-2xl">
                Calcular Precio de Venta →
              </Button>
              {!isViewMode && (
                <Button variant="outline" onClick={() => setStep(1)} className="w-full h-12 rounded-xl">
                  Volver a editar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout >
  );
}
