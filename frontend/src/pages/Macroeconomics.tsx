import { useState } from 'react';
import { 
  Globe2, 
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Info,
  ArrowRight,
  Landmark
} from 'lucide-react';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';
import ReactMarkdown from 'react-markdown';

interface ProductInput {
  id: string;
  name: string;
  quantity: number | '';
  currentPrice: number | '';
  basePrice: number | '';
}

export default function Macroeconomics() {
  const { isSimpleMode } = useMode();
  
  // -- GDP Expenditure State --
  const [currency, setCurrency] = useState('USD');
  const [c, setC] = useState<number | string>('');
  const [i, setI] = useState<number | string>('');
  const [g, setG] = useState<number | string>('');
  const [x, setX] = useState<number | string>('');
  const [m, setM] = useState<number | string>('');

  const gdpTotal = (Number(c) || 0) + (Number(i) || 0) + (Number(g) || 0) + ((Number(x) || 0) - (Number(m) || 0));

  // -- Nominal vs Real GDP State --
  const [products, setProducts] = useState<ProductInput[]>([
    { id: '1', name: 'Product A', quantity: 100, currentPrice: 50, basePrice: 40 },
    { id: '2', name: 'Product B', quantity: 200, currentPrice: 30, basePrice: 25 },
  ]);

  const addProduct = () => {
    setProducts([...products, { id: Math.random().toString(36).substr(2, 9), name: `Product ${String.fromCharCode(65 + products.length)}`, quantity: '', currentPrice: '', basePrice: '' }]);
  };
  const updateProduct = (id: string, field: keyof ProductInput, value: string | number) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value === '' ? '' : Math.max(0, Number(value)) } : p));
  };
  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const nominalGdp = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.currentPrice) || 0)), 0);
  const realGdp = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.basePrice) || 0)), 0);

  // -- GDP Deflator State --
  const [useCalculatedDeflator, setUseCalculatedDeflator] = useState(true);
  const [manualNominalGdp, setManualNominalGdp] = useState<number | string>('');
  const [manualRealGdp, setManualRealGdp] = useState<number | string>('');
  const [previousDeflator, setPreviousDeflator] = useState<number | string>(100);

  const currentNominalGdpDeflator = useCalculatedDeflator ? nominalGdp : (Number(manualNominalGdp) || 0);
  const currentRealGdpDeflator = useCalculatedDeflator ? realGdp : (Number(manualRealGdp) || 0);
  
  const gdpDeflator = currentRealGdpDeflator > 0 ? (currentNominalGdpDeflator / currentRealGdpDeflator) * 100 : 0;
  const deflatorChange = Number(previousDeflator) > 0 ? ((gdpDeflator - Number(previousDeflator)) / Number(previousDeflator)) * 100 : 0;

  // -- GNP/GNI State --
  const [gnpGdp, setGnpGdp] = useState<number | string>('');
  const [incomeFromAbroad, setIncomeFromAbroad] = useState<number | string>('');
  const [incomeToAbroad, setIncomeToAbroad] = useState<number | string>('');
  
  const netFactorIncome = (Number(incomeFromAbroad) || 0) - (Number(incomeToAbroad) || 0);
  const gnp = (Number(gnpGdp) || 0) + netFactorIncome;

  // -- Monetary Policy Simulator State --
  const [prevRate, setPrevRate] = useState<number | string>(6.5);
  const [newRate, setNewRate] = useState<number | string>(6.0);
  const [inflationRate, setInflationRate] = useState<number | string>(3.2);
  const [gdpGrowthRate, setGdpGrowthRate] = useState<number | string>(1.5);

  const rateChange = (Number(newRate) || 0) - (Number(prevRate) || 0);
  const policyClassification = rateChange > 0 ? 'Potentially contractionary monetary policy' : rateChange < 0 ? 'Potentially expansionary monetary policy' : 'No change in policy rate';

  // -- AI Explanation State --
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAskAI = async (submodule: string, context: string) => {
    setAiLoading(true);
    setAiError(null);
    setAiExplanation(null);
    
    let payload = {};
    if (submodule === 'gdp_expenditure') {
      payload = { c, i, g, x, m, gdpTotal, currency };
    } else if (submodule === 'nominal_real') {
      payload = { nominalGdp, realGdp, products, currency };
    } else if (submodule === 'deflator') {
      payload = { nominal: currentNominalGdpDeflator, real: currentRealGdpDeflator, deflator: gdpDeflator, change: deflatorChange };
    } else if (submodule === 'gnp') {
      payload = { gdp: gnpGdp, netFactorIncome, gnp, currency };
    } else if (submodule === 'monetary_policy') {
      payload = { prevRate, newRate, rateChange, inflationRate, gdpGrowthRate, classification: policyClassification };
    }

    try {
      const res = await fetch('http://localhost:8000/api/ai/explain-macro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'macroeconomics',
          submodule,
          inputs: payload,
          calculated_results: payload,
          context: { description: context },
          user_question: "Explain these macroeconomic results simply."
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'AI request failed');
      setAiExplanation(data.explanation);
    } catch (err: any) {
      setAiError(err.message || 'Failed to connect to AI explanation engine.');
    } finally {
      setAiLoading(false);
    }
  };

  const resetExpenditure = () => { setC(''); setI(''); setG(''); setX(''); setM(''); };
  const resetProduction = () => { setProducts([{ id: '1', name: 'Product A', quantity: '', currentPrice: '', basePrice: '' }]); };
  const resetDeflator = () => { setManualNominalGdp(''); setManualRealGdp(''); setPreviousDeflator(100); setUseCalculatedDeflator(true); };
  const resetGnp = () => { setGnpGdp(''); setIncomeFromAbroad(''); setIncomeToAbroad(''); };
  const resetPolicy = () => { setPrevRate(''); setNewRate(''); setInflationRate(''); setGdpGrowthRate(''); };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface via-surfaceHover to-surface border border-border p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold mb-3">
              <Globe2 className="w-3.5 h-3.5" /> Macroeconomic Analysis
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Macroeconomic Environment Simulators
            </h1>
            <p className="text-textMuted text-sm mt-1 max-w-2xl">
              Deterministic calculation modules for National Accounts (GDP, GNP, Deflators) and Monetary Policy transmission analysis.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-background p-2 rounded-lg border border-border">
            <span className="text-xs text-textMuted ml-1">Currency/Unit:</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-surface border border-border rounded px-2 py-1 text-sm font-bold text-white outline-none cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="Units">Generic Units</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1. GDP Expenditure Calculator */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
            <div>
              <h2 className="text-lg font-bold text-white">Gross Domestic Product (Expenditure Approach)</h2>
              <p className="text-xs text-textMuted mb-1">Formula: GDP = C + I + G + (X - M)</p>
            </div>
          </div>
          <button onClick={resetExpenditure} className="p-2 bg-surfaceHover rounded hover:bg-border transition-colors group" title="Reset">
            <RefreshCw className="w-4 h-4 text-textMuted group-hover:text-white" />
          </button>
        </div>

        <p className="text-sm text-textMuted leading-relaxed">
          This calculator measures a country's economic size by adding up all the money spent by its various groups. Enter the estimated spending for each category below to compute the total Gross Domestic Product.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted">Private Consumption (C)</label>
              <input type="number" min="0" value={c} onChange={e => setC(e.target.value)} placeholder="e.g. Household spending" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">Total spending by consumers on everyday goods (food, rent, gas).</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted">Investment (I)</label>
              <input type="number" min="0" value={i} onChange={e => setI(e.target.value)} placeholder="e.g. Business equipment" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">Money spent by businesses on machinery, factories, or inventory.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted">Government Expenditure (G)</label>
              <input type="number" min="0" value={g} onChange={e => setG(e.target.value)} placeholder="e.g. Public infrastructure" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">Government spending on public services, military, and infrastructure.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Exports (X)</label>
                <input type="number" min="0" value={x} onChange={e => setX(e.target.value)} placeholder="e.g. Goods sold abroad" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
                <p className="text-[10px] text-textMuted opacity-70">Value of domestic goods sold to foreign countries.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Imports (M)</label>
                <input type="number" min="0" value={m} onChange={e => setM(e.target.value)} placeholder="e.g. Foreign goods bought" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
                <p className="text-[10px] text-textMuted opacity-70">Value of foreign goods purchased by domestic consumers.</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-4 bg-surfaceHover rounded-xl p-5 border border-border flex flex-col justify-center items-center text-center">
            <span className="text-xs uppercase font-bold text-textMuted tracking-wider mb-2">Calculated GDP</span>
            <span className="text-3xl font-black text-white font-mono">
              {currency !== 'Units' ? currency : ''} {gdpTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <div className="mt-4 text-[10px] text-textMuted font-mono bg-background px-3 py-1.5 rounded-lg border border-border">
              {c || 0} + {i || 0} + {g || 0} + ({x || 0} - {m || 0})
            </div>
            <button 
              onClick={() => handleAskAI('gdp_expenditure', 'Expenditure approach GDP calculation.')}
              className="mt-6 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Explain Result
            </button>
          </div>
        </div>
      </section>

      {/* 2. Nominal vs Real GDP */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold">2</div>
            <div>
              <h2 className="text-lg font-bold text-white">Nominal vs. Real GDP Calculator</h2>
              <p className="text-xs text-textMuted">Production approach tracking multiple goods across time periods.</p>
            </div>
          </div>
          <button onClick={resetProduction} className="p-2 bg-surfaceHover rounded hover:bg-border transition-colors group" title="Reset">
            <RefreshCw className="w-4 h-4 text-textMuted group-hover:text-white" />
          </button>
        </div>

        <p className="text-sm text-textMuted leading-relaxed">
          Calculate how much of a country's economic growth is real vs. just inflation. Enter a few sample products the economy makes, how many they made this year (Current Quantity), what they cost this year (Current Price), and what they cost in a past "Base" year.
        </p>

        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="p-3 text-xs text-textMuted font-semibold">Product/Service</th>
                <th className="p-3 text-xs text-textMuted font-semibold">Current Quantity</th>
                <th className="p-3 text-xs text-textMuted font-semibold">Current Price</th>
                <th className="p-3 text-xs text-textMuted font-semibold">Base-Year Price</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-surfaceHover/30">
                  <td className="p-2"><input type="text" value={p.name} onChange={e => updateProduct(p.id, 'name', e.target.value)} className="w-full bg-surface border border-border rounded p-1.5 text-white text-xs" /></td>
                  <td className="p-2"><input type="number" min="0" value={p.quantity} onChange={e => updateProduct(p.id, 'quantity', e.target.value)} className="w-full bg-surface border border-border rounded p-1.5 text-white font-mono text-xs" /></td>
                  <td className="p-2"><input type="number" min="0" value={p.currentPrice} onChange={e => updateProduct(p.id, 'currentPrice', e.target.value)} className="w-full bg-surface border border-border rounded p-1.5 text-white font-mono text-xs" /></td>
                  <td className="p-2"><input type="number" min="0" value={p.basePrice} onChange={e => updateProduct(p.id, 'basePrice', e.target.value)} className="w-full bg-surface border border-border rounded p-1.5 text-white font-mono text-xs" /></td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeProduct(p.id)} className="p-1.5 text-textMuted hover:text-danger rounded hover:bg-danger/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 border-t border-border bg-surface/50 flex justify-between items-center">
            <button onClick={addProduct} className="px-3 py-1.5 text-xs font-semibold text-textMuted hover:text-white bg-surface hover:bg-surfaceHover border border-border rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between">
            <div>
              <div className="text-xs text-textMuted font-bold mb-1">Nominal GDP</div>
              <div className="text-[10px] text-textMuted mb-2">Σ(Current Qty × Current Price)</div>
              <GlossaryTerm 
                term="Nominal GDP" 
                simpleLabel="Raw Economic Size" 
                definition="Total value of goods produced at today's prices, without removing inflation." 
                isSimpleMode={isSimpleMode} 
              />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {nominalGdp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border flex flex-col justify-center">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="text-xs text-textMuted font-bold mb-1">Real GDP</div>
                <div className="text-[10px] text-textMuted mb-2">Σ(Current Qty × Base-Year Price)</div>
                <GlossaryTerm 
                  term="Real GDP" 
                  simpleLabel="True Economic Growth" 
                  definition="Total value of goods produced using fixed base-year prices, removing the illusion of inflation." 
                  isSimpleMode={isSimpleMode} 
                />
              </div>
              <div className="text-2xl font-black text-secondary font-mono">
                {realGdp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button 
              onClick={() => handleAskAI('nominal_real', 'Nominal vs Real GDP Calculation.')}
              className="mt-4 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Explain Result
            </button>
          </div>
        </div>
      </section>

      {/* 3. GDP Deflator */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">3</div>
            <div>
              <h2 className="text-lg font-bold text-white">GDP Deflator & Inflation Tracking</h2>
              <p className="text-xs text-textMuted">Formula: (Nominal GDP / Real GDP) × 100</p>
            </div>
          </div>
          <button onClick={resetDeflator} className="p-2 bg-surfaceHover rounded hover:bg-border transition-colors group" title="Reset">
            <RefreshCw className="w-4 h-4 text-textMuted group-hover:text-white" />
          </button>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs text-textMuted flex items-start gap-2 mb-4">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p>
            The GDP deflator measures price changes across the entire economy (unlike CPI, which only measures a consumer basket). A base-year deflator is exactly 100.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                id="linkGdp" 
                checked={useCalculatedDeflator} 
                onChange={(e) => setUseCalculatedDeflator(e.target.checked)}
                className="rounded border-border bg-background text-primary focus:ring-primary/50"
              />
              <label htmlFor="linkGdp" className="text-xs text-white font-medium cursor-pointer">
                Use Nominal/Real GDP calculated in Section 2
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Nominal GDP</label>
                <input 
                  type="number" min="0" 
                  value={useCalculatedDeflator ? nominalGdp : manualNominalGdp} 
                  onChange={e => setManualNominalGdp(e.target.value)} 
                  disabled={useCalculatedDeflator}
                  className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono disabled:opacity-50" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Real GDP</label>
                <input 
                  type="number" min="0" 
                  value={useCalculatedDeflator ? realGdp : manualRealGdp} 
                  onChange={e => setManualRealGdp(e.target.value)} 
                  disabled={useCalculatedDeflator}
                  className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono disabled:opacity-50" 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <label className="text-xs font-medium text-textMuted mb-2 block">Previous Period Deflator (for % change)</label>
              <input type="number" min="0" value={previousDeflator} onChange={e => setPreviousDeflator(e.target.value)} className="w-1/2 bg-background border border-border rounded-lg p-2 text-white font-mono" />
            </div>
          </div>
          
          <div className="md:col-span-5 grid gap-4">
            <div className="bg-surface rounded-xl p-4 border border-border text-center">
              <span className="text-xs text-textMuted font-bold block mb-1">GDP Deflator Index</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {currentRealGdpDeflator <= 0 ? (
                  <span className="text-sm text-danger flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4"/> Real GDP must be &gt; 0</span>
                ) : (
                  gdpDeflator.toFixed(2)
                )}
              </span>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border text-center">
              <span className="text-xs text-textMuted font-bold block mb-1">Deflator % Change (Inflation)</span>
              <span className={`text-2xl font-black font-mono ${deflatorChange > 0 ? 'text-danger' : deflatorChange < 0 ? 'text-secondary' : 'text-white'}`}>
                {currentRealGdpDeflator <= 0 || Number(previousDeflator) <= 0 ? '--' : `${deflatorChange > 0 ? '+' : ''}${deflatorChange.toFixed(2)}%`}
              </span>
            </div>
            <button 
              onClick={() => handleAskAI('deflator', 'GDP Deflator and Inflation Tracking.')}
              className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Explain Result
            </button>
          </div>
        </div>
      </section>

      {/* 4. GNP / GNI */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">4</div>
            <div>
              <h2 className="text-lg font-bold text-white">Gross National Product (GNP) / GNI</h2>
              <p className="text-xs text-textMuted">Formula: GDP + (Income from Abroad - Income paid to Foreigners)</p>
            </div>
          </div>
          <button onClick={resetGnp} className="p-2 bg-surfaceHover rounded hover:bg-border transition-colors group" title="Reset">
            <RefreshCw className="w-4 h-4 text-textMuted group-hover:text-white" />
          </button>
        </div>

        <p className="text-sm text-textMuted leading-relaxed">
          While GDP measures what is produced <strong>inside</strong> a country's borders, GNP measures what is produced by a country's <strong>citizens</strong>, regardless of where they are in the world. Use this to adjust GDP based on international cash flows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted flex justify-between">
                <span>Domestic GDP</span>
                <button onClick={() => setGnpGdp(gdpTotal)} className="text-primary hover:underline text-[10px]">Use Section 1 GDP</button>
              </label>
              <input type="number" min="0" value={gnpGdp} onChange={e => setGnpGdp(e.target.value)} placeholder="e.g. 25000000" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">The baseline Gross Domestic Product calculated earlier.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted">Income Received from Abroad</label>
              <input type="number" min="0" value={incomeFromAbroad} onChange={e => setIncomeFromAbroad(e.target.value)} placeholder="e.g. Profits from overseas branches" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">Money earned by your citizens/companies operating in other countries.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-textMuted">Income Paid to Foreign Factors</label>
              <input type="number" min="0" value={incomeToAbroad} onChange={e => setIncomeToAbroad(e.target.value)} placeholder="e.g. Profits sent to foreign HQs" className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              <p className="text-[10px] text-textMuted opacity-70">Money earned by foreign citizens/companies operating inside your country.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 border border-border flex justify-between items-center">
              <span className="text-xs text-textMuted font-bold block mb-1">Net Factor Income</span>
              <span className={`text-lg font-black font-mono ${netFactorIncome >= 0 ? 'text-secondary' : 'text-danger'}`}>
                {netFactorIncome >= 0 ? '+' : ''}{netFactorIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="bg-indigo-950/20 rounded-xl p-5 border border-indigo-500/30 flex flex-col justify-center items-center text-center flex-1 h-full">
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-2">Calculated GNP</span>
              <span className="text-3xl font-black text-white font-mono">
                {gnp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-textMuted mt-4 px-4">
                <strong>GDP:</strong> Production within borders.<br/>
                <strong>GNP/GNI:</strong> Output/Income attributable to residents, regardless of location.
              </p>
              <button 
                onClick={() => handleAskAI('gnp', 'GNP / GNI Calculation.')}
                className="mt-4 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Explain Result
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Monetary Policy Simulator */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">5</div>
            <div>
              <h2 className="text-lg font-bold text-white">Monetary Policy Transmission Simulator</h2>
              <p className="text-xs text-textMuted">Analyze the theoretical impact of central bank interest rate changes.</p>
            </div>
          </div>
          <button onClick={resetPolicy} className="p-2 bg-surfaceHover rounded hover:bg-border transition-colors group" title="Reset">
            <RefreshCw className="w-4 h-4 text-textMuted group-hover:text-white" />
          </button>
        </div>

        <p className="text-sm text-textMuted leading-relaxed">
          See how changes in a Central Bank's interest rates theoretically ripple through the economy to affect borrowing, inflation, and growth. Enter the old and new interest rates to see the transmission mechanism.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Previous Policy Rate (%)</label>
                <input type="number" step="0.25" value={prevRate} onChange={e => setPrevRate(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">New Policy Rate (%)</label>
                <input type="number" step="0.25" value={newRate} onChange={e => setNewRate(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono border-rose-500/50" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Optional: Inflation (%)</label>
                <input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-textMuted">Optional: GDP Growth (%)</label>
                <input type="number" step="0.1" value={gdpGrowthRate} onChange={e => setGdpGrowthRate(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-white font-mono" />
              </div>
            </div>

            <button 
              onClick={() => handleAskAI('monetary_policy', 'Monetary Policy rate transmission explanation.')}
              className="mt-2 w-full py-2.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" /> AI Explanation of Policy Impact
            </button>
          </div>

          <div className="md:col-span-7 bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
            <div className={`p-4 border-b border-border flex justify-between items-center ${
              rateChange > 0 ? 'bg-rose-950/20' : rateChange < 0 ? 'bg-emerald-950/20' : 'bg-surface'
            }`}>
              <div>
                <div className="text-xs font-bold text-textMuted uppercase mb-1">Policy Classification</div>
                <div className={`text-lg font-black ${rateChange > 0 ? 'text-rose-400' : rateChange < 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {policyClassification}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-textMuted uppercase mb-1">Rate Change</div>
                <div className={`text-xl font-black font-mono ${rateChange > 0 ? 'text-rose-400' : rateChange < 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {rateChange > 0 ? '+' : ''}{rateChange.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-background flex-1">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-textMuted" />
                Theoretical Transmission Mechanism
              </h4>
              
              {rateChange === 0 ? (
                <div className="text-sm text-textMuted italic">No policy rate change detected. Monetary transmission remains neutral.</div>
              ) : rateChange > 0 ? (
                <div className="space-y-2 text-sm text-textMuted">
                  <div className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-rose-500" /> <span className="text-white font-semibold">Higher policy rate</span> established by central bank</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight className="w-3 h-3 text-rose-500" /> Market interest rates may increase</div>
                  <div className="flex items-center gap-2 pl-8"><ArrowRight className="w-3 h-3 text-rose-500" /> Borrowing may become more expensive</div>
                  <div className="flex items-center gap-2 pl-12"><ArrowRight className="w-3 h-3 text-rose-500" /> Consumption and investment may weaken</div>
                  <div className="flex items-center gap-2 pl-16"><ArrowRight className="w-3 h-3 text-rose-500" /> Aggregate demand may weaken</div>
                  <div className="flex items-center gap-2 pl-20"><ArrowRight className="w-3 h-3 text-rose-500" /> <span className="text-rose-400 font-semibold">Inflationary pressure may ease</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-textMuted">
                  <div className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-emerald-500" /> <span className="text-white font-semibold">Lower policy rate</span> established by central bank</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight className="w-3 h-3 text-emerald-500" /> Market interest rates may decrease</div>
                  <div className="flex items-center gap-2 pl-8"><ArrowRight className="w-3 h-3 text-emerald-500" /> Borrowing may become cheaper</div>
                  <div className="flex items-center gap-2 pl-12"><ArrowRight className="w-3 h-3 text-emerald-500" /> Consumption and investment may strengthen</div>
                  <div className="flex items-center gap-2 pl-16"><ArrowRight className="w-3 h-3 text-emerald-500" /> Aggregate demand may strengthen</div>
                  <div className="flex items-center gap-2 pl-20"><ArrowRight className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-400 font-semibold">Inflationary pressure may increase</span></div>
                </div>
              )}
              
              <div className="mt-6 text-[10px] text-gray-500 italic border-t border-border pt-3">
                Note: Transmission depends heavily on prevailing economic conditions, credit availability, forward guidance expectations, and external shocks. Real-world outcomes may deviate from this theoretical model.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Explanation Modal / Overlay */}
      {(aiLoading || aiExplanation || aiError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surfaceHover">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Macroeconomic Analysis
              </h3>
              <button 
                onClick={() => { setAiLoading(false); setAiExplanation(null); setAiError(null); }}
                className="text-textMuted hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-textMuted">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium animate-pulse">Consulting Quantitative Intelligence Engine...</p>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
                  <p className="font-bold mb-2">Analysis Failed</p>
                  <p>{aiError}</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-text">
                  <ReactMarkdown>{aiExplanation || ''}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
