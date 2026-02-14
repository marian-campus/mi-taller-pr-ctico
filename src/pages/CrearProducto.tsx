import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams } from 'react-router-dom';
import { RecipeIngredient, Product, Supply } from '@/types';
import { ArrowLeft, ArrowRight, Plus, X, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { categoryEmojis } from '@/components/CategoryIcon';

const productCategories = [
  { value: 'gastronomia', label: '🍰 Gastronomía' },
  { value: 'indumentaria', label: '👗 Indumentaria' },
  { value: 'cosmetica', label: '💄 Cosmética' },
  { value: 'artesanias', label: '🎨 Artesanías' },
  { value: 'servicios', label: '💼 Servicios' },
  { value: 'otros', label: '📦 Otros' },
];

const unitOptions = ['kg', 'g', 'L', 'ml', 'm', 'cm', 'unidades'];

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
  const { supplies, addSupply, addProduct, updateProduct, products, user } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? products.find(p => p.id === id) : null;

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'gastronomia');

  // Step 2
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existing?.ingredients || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  // New supply form
  const [showNewSupply, setShowNewSupply] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('gastronomia');

  // Step 3
  const [packaging, setPackaging] = useState<RecipeIngredient[]>(existing?.packaging || []);
  const [packSearch, setPackSearch] = useState('');
  const [packQty, setPackQty] = useState<Record<string, string>>({});
  const [useServices, setUseServices] = useState(existing ? (existing.services.hours > 0 || existing.services.minutes > 0) : false);
  const [svcHours, setSvcHours] = useState(existing?.services.hours || 0);
  const [svcMinutes, setSvcMinutes] = useState(existing?.services.minutes || 0);
  const [includeFixed, setIncludeFixed] = useState(existing?.includeFixedCosts || false);
  const [estUnits, setEstUnits] = useState(existing?.estimatedUnitsPerMonth || 10);

  // Step 4
  const [labHours, setLabHours] = useState(existing?.labor.hours || 0);
  const [labMinutes, setLabMinutes] = useState(existing?.labor.minutes || 0);

  // Calculations
  const ingCost = ingredients.reduce((s, i) => s + i.cost, 0);
  const packCost = packaging.reduce((s, i) => s + i.cost, 0);
  const svcCost = useServices ? (svcHours + svcMinutes / 60) * user.gasCostPerHour : 0;
  const labCost = (labHours + labMinutes / 60) * user.hourlyRate;
  const totalFixed = user.fixedCosts.reduce((s, f) => s + f.amount, 0);
  const fixedPU = includeFixed && estUnits > 0 ? totalFixed / estUnits : 0;
  const totalCost = Math.round(ingCost + packCost + svcCost + labCost + fixedPU);

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
    const qty = parseFloat(inputs[supply.id] || '0');
    if (qty <= 0) return;
    const cost = Math.round(qty * supply.pricePerUnit * 100) / 100;
    const item: RecipeIngredient = {
      id: Date.now().toString() + Math.random(),
      supplyId: supply.id,
      name: supply.name,
      quantityUsed: qty,
      unit: supply.unit,
      cost,
    };
    if (target === 'ingredients') {
      setIngredients(prev => [...prev, item]);
      setQtyInputs(prev => ({ ...prev, [supply.id]: '' }));
    } else {
      setPackaging(prev => [...prev, item]);
      setPackQty(prev => ({ ...prev, [supply.id]: '' }));
    }
  };

  const saveNewSupply = () => {
    if (!newName.trim() || !newQty || !newPrice) return;
    const supply: Supply = {
      id: 'ns-' + Date.now(),
      name: newName.trim(),
      category: newCat,
      quantityBought: parseFloat(newQty),
      unit: newUnit,
      pricePaid: parseFloat(newPrice),
      pricePerUnit: parseFloat(newPrice) / parseFloat(newQty),
    };
    addSupply(supply);
    setShowNewSupply(false);
    setNewName(''); setNewQty(''); setNewPrice('');
    toast.success('¡Insumo guardado!');
  };

  const handleSave = () => {
    const product: Product = {
      id: existing?.id || 'prod-' + Date.now(),
      name,
      category,
      ingredients,
      packaging,
      services: { hours: svcHours, minutes: svcMinutes, cost: Math.round(svcCost) },
      labor: { hours: labHours, minutes: labMinutes, cost: Math.round(labCost) },
      includeFixedCosts: includeFixed,
      estimatedUnitsPerMonth: estUnits,
      fixedCostPerUnit: Math.round(fixedPU),
      totalCost,
      sellingPrice: existing?.sellingPrice,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
    };
    if (existing) updateProduct(product); else addProduct(product);
    toast.success('🎯 ¡Receta guardada!');
    navigate('/recetario');
  };

  const emoji = categoryEmojis[category] || '📦';

  return (
    <Layout title={existing ? 'Editar Receta' : '📝 Nueva Receta'}>
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
              {filteredSupplies.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(s.pricePaid)}/{s.quantityBought}{s.unit}</p>
                  </div>
                  <Input type="number" placeholder="Cant." className="w-20 h-8 text-sm"
                    value={qtyInputs[s.id] || ''}
                    onChange={e => setQtyInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                    min="0" step="0.01" />
                  <span className="text-xs text-muted-foreground w-12 truncate">{s.unit}</span>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => addIng(s, 'ingredients')}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => { setShowNewSupply(true); setNewCat(category); }}>
              + Agregar Nuevo Insumo
            </Button>

            {showNewSupply && (
              <Card className="p-3 space-y-2 border-primary border-2">
                <p className="text-sm font-semibold">Nuevo Insumo</p>
                <Input placeholder="Nombre del insumo" value={newName} onChange={e => setNewName(e.target.value)} />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Cantidad comprada" value={newQty} onChange={e => setNewQty(e.target.value)} className="flex-1" />
                  <select value={newUnit} onChange={e => setNewUnit(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm w-28">
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <Input type="number" placeholder="Precio pagado ($)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNewSupply} className="flex-1">Guardar Insumo</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewSupply(false)}>Cancelar</Button>
                </div>
              </Card>
            )}

            {ingredients.length > 0 && (
              <Card className="p-3">
                <h3 className="text-sm font-semibold mb-2">📦 Insumos de Esta Receta</h3>
                <div className="space-y-1">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <span className="text-sm flex-1 truncate">{ing.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{ing.quantityUsed} {ing.unit}</span>
                      <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(ing.cost)}</span>
                      <button onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))} className="text-destructive shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 font-semibold text-sm border-t mt-2">
                  <span>Materias Primas</span>
                  <span className="text-primary">{formatCurrency(ingCost)}</span>
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

            {/* Services */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">⚡ Servicios (Gas/Electricidad)</h3>
                <Switch checked={useServices} onCheckedChange={setUseServices} />
              </div>
              {useServices && (
                <div className="space-y-2 pt-1">
                  <Label className="text-sm">Tiempo de uso</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="number" placeholder="0" value={svcHours || ''} onChange={e => setSvcHours(parseInt(e.target.value) || 0)} className="w-20" min="0" />
                    <span className="text-sm text-muted-foreground">hs</span>
                    <Input type="number" placeholder="0" value={svcMinutes || ''} onChange={e => setSvcMinutes(parseInt(e.target.value) || 0)} className="w-20" min="0" max="59" />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <p className="text-sm font-medium text-primary">Costo servicios: {formatCurrency(svcCost)}</p>
                </div>
              )}
            </Card>

            {/* Packaging */}
            <Card className="p-4 space-y-3">
              <h3 className="font-medium">📦 Packaging</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar packaging..." value={packSearch} onChange={e => setPackSearch(e.target.value)} />
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filteredPack.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(s.pricePerUnit)}/{s.unit}</p>
                    </div>
                    <Input type="number" placeholder="Cant." className="w-20 h-8 text-sm"
                      value={packQty[s.id] || ''}
                      onChange={e => setPackQty(prev => ({ ...prev, [s.id]: e.target.value }))}
                      min="0" />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => addIng(s, 'packaging')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {packaging.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {packaging.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{p.name} ({p.quantityUsed} {p.unit})</span>
                      <span className="font-medium mx-2">{formatCurrency(p.cost)}</span>
                      <button onClick={() => setPackaging(prev => prev.filter(i => i.id !== p.id))} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <p className="font-medium text-primary text-sm">Packaging: {formatCurrency(packCost)}</p>
                </div>
              )}
            </Card>

            {/* Fixed Costs */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">🏠 Gastos Fijos Mensuales</h3>
                <Switch checked={includeFixed} onCheckedChange={setIncludeFixed} />
              </div>
              {includeFixed && (
                <div className="space-y-2 pt-1">
                  {user.fixedCosts.map((fc, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{fc.name}</span><span>{formatCurrency(fc.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <Label className="text-sm">Estimás producir por mes:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input type="number" value={estUnits} onChange={e => setEstUnits(parseInt(e.target.value) || 1)} className="w-24" min="1" />
                      <span className="text-sm text-muted-foreground">unidades</span>
                    </div>
                    <p className="text-sm font-medium text-primary mt-1">Costo fijo/unidad: {formatCurrency(fixedPU)}</p>
                  </div>
                </div>
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
              <p className="text-sm text-muted-foreground">Tu valor/hora: <span className="font-bold text-foreground">{formatCurrency(user.hourlyRate)}</span></p>
              <p className="text-xl font-bold text-primary mt-1">Costo de tu trabajo: {formatCurrency(labCost)}</p>
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

        {/* STEP 5: Result */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">🎯 ¡Excelente! Ya sabés cuánto te cuesta producir.</h2>

            <Card className="p-5 space-y-3 rounded-xl">
              <h3 className="text-xl font-bold">{emoji} {name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>📦 Materias Primas</span><span className="font-medium">{formatCurrency(ingCost)}</span></div>
                <div className="flex justify-between"><span>📦 Packaging</span><span className="font-medium">{formatCurrency(packCost)}</span></div>
                <div className="flex justify-between"><span>⚡ Servicios</span><span className="font-medium">{formatCurrency(svcCost)}</span></div>
                <div className="flex justify-between"><span>⏱️ Tu Tiempo ({labHours}h {labMinutes}min)</span><span className="font-medium">{formatCurrency(labCost)}</span></div>
                {includeFixed && <div className="flex justify-between"><span>🏠 Gastos Fijos</span><span className="font-medium">{formatCurrency(fixedPU)}</span></div>}
                <div className="border-t border-border pt-2 flex justify-between text-lg">
                  <span className="font-bold">💰 COSTO TOTAL</span>
                  <span className="font-bold text-primary">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Button onClick={handleSave} className="w-full h-12">Guardar Receta</Button>
              <Button variant="cta" onClick={() => { handleSave(); navigate('/precio-justo'); }} className="w-full h-12">
                Calcular Precio de Venta →
              </Button>
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">Volver a editar</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
