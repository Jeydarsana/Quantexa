import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute } from 'wouter';
import {
  Activity, BarChart3, BookOpen, BrainCircuit, CircleHelp, FlaskConical,
  Gauge, Info, LineChart, Menu, Play, RefreshCw, Search, ShieldCheck, Sparkles,
  Target, X, Zap,
} from 'lucide-react';
import {
  getGetOverviewQueryKey, getGetSimulationQueryKey, useCompareStrategies,
  useGetAnalytics, useGetAssets, useGetCorrelation, useGetGlossary,
  useGetOverview, useGetSimulation, useRunBacktest, useRunDna,
} from '@workspace/api-client-react';
import type { Asset, BacktestResult, ChartPoint, Metric } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const nav = [
  { href: '/', label: 'Overview', icon: Gauge, note: 'Start here' },
  { href: '/dna', label: 'Strategy DNA', icon: BrainCircuit, note: 'Guided analysis' },
  { href: '/analytics', label: 'Deep Dive', icon: LineChart, note: 'Charts & stats' },
  { href: '/correlation', label: 'Relationships', icon: Activity, note: 'Move together' },
  { href: '/backtest', label: 'Test a Strategy', icon: FlaskConical, note: 'Past outcomes' },
  { href: '/simulation', label: 'Simulation', icon: Play, note: 'Trade timeline' },
  { href: '/compare', label: 'Strategy Lab', icon: BarChart3, note: 'Leaderboard' },
];

type Mode = 'simple' | 'expert';

function assetTitle(asset?: Asset) {
  return asset ? `${asset.ticker} · ${asset.proxyName}` : 'Select an asset';
}

function useWorkspace() {
  const assetsQuery = useGetAssets();
  const assets = assetsQuery.data;
  const [shortTicker, setShortTicker] = useState(() => localStorage.getItem('ql-short') || 'BIL');
  const [longTicker, setLongTicker] = useState(() => localStorage.getItem('ql-long') || 'AGG');
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('ql-mode') as Mode) || 'simple');
  useEffect(() => { localStorage.setItem('ql-short', shortTicker); }, [shortTicker]);
  useEffect(() => { localStorage.setItem('ql-long', longTicker); }, [longTicker]);
  useEffect(() => { localStorage.setItem('ql-mode', mode); }, [mode]);
  const allAssets = useMemo(() => assets ? [...assets.shortTerm, ...assets.longTerm, ...assets.reference] : [], [assets]);
  useEffect(() => {
    if (!assets) return;
    if (!assets.shortTerm.some((asset) => asset.ticker === shortTicker)) setShortTicker(assets.shortTerm[0]?.ticker || 'BIL');
    if (!assets.longTerm.some((asset) => asset.ticker === longTicker)) setLongTicker(assets.longTerm[0]?.ticker || 'AGG');
  }, [assets, longTicker, shortTicker]);
  const shortAsset = allAssets.find((a) => a.ticker === shortTicker) || assets?.shortTerm?.[0];
  const longAsset = allAssets.find((a) => a.ticker === longTicker) || assets?.longTerm?.[0];
  return { assetsQuery, assets, allAssets, shortTicker, longTicker, setShortTicker, setLongTicker, mode, setMode, shortAsset, longAsset };
}

function Shell({ children, workspace }: { children: ReactNode; workspace: ReturnType<typeof useWorkspace> }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-5">
          <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
            <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Target size={19} strokeWidth={2.5} /></span>
            <span><span className="block font-bold tracking-[-0.03em] text-sidebar-accent-foreground">QuantLens</span><span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Research terminal</span></span>
          </Link>
          <button className="text-sidebar-foreground/60 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={19} /></button>
        </div>
        <div className="px-3 pt-6">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/45">Workspace</p>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon, note }) => {
              const active = location === href;
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={17} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/55'} />
                <span className="min-w-0"><span className="block text-[13px] font-semibold">{label}</span><span className="block truncate text-[10px] text-sidebar-foreground/45">{note}</span></span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary pulse-dot" />}
              </Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <Link href="/about" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" data-testid="link-nav-about">
            <BookOpen size={17} /><span><span className="block text-[13px] font-semibold">How it works</span><span className="block text-[10px] text-sidebar-foreground/45">Glossary & formulas</span></span>
          </Link>
          <div className="mt-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-sidebar-accent-foreground"><span className="size-1.5 rounded-full bg-sidebar-primary pulse-dot" /> Data connection live</div>
            <div className="mt-1.5 font-mono text-[9px] text-sidebar-foreground/45">Daily proxies · educational use</div>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-overlay-close" />}
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="rounded-lg p-2 hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Workspace</span><span>/</span><span className="font-semibold text-foreground">{nav.find((n) => n.href === location)?.label || 'Guide'}</span></div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 sm:flex">
                <span className="size-2 rounded-full" style={{ backgroundColor: workspace.shortAsset?.color || '#50c9a7' }} />
                <select value={workspace.shortTicker} onChange={(e) => workspace.setShortTicker(e.target.value)} className="max-w-[124px] bg-transparent text-xs font-semibold outline-none" data-testid="select-short-asset">
                  {(workspace.assets?.shortTerm || []).map((a) => <option key={a.ticker} value={a.ticker}>{a.ticker} · short-term</option>)}
                  {!workspace.assets && <option value={workspace.shortTicker}>{workspace.shortTicker} · short-term</option>}
                </select>
              </div>
              <span className="hidden text-muted-foreground sm:block">+</span>
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 sm:flex">
                <span className="size-2 rounded-full" style={{ backgroundColor: workspace.longAsset?.color || '#e8b44a' }} />
                <select value={workspace.longTicker} onChange={(e) => workspace.setLongTicker(e.target.value)} className="max-w-[124px] bg-transparent text-xs font-semibold outline-none" data-testid="select-long-asset">
                  {(workspace.assets?.longTerm || []).map((a) => <option key={a.ticker} value={a.ticker}>{a.ticker} · long-term</option>)}
                  {!workspace.assets && <option value={workspace.longTicker}>{workspace.longTicker} · long-term</option>}
                </select>
              </div>
              <div className="flex rounded-lg border border-border bg-card p-0.5">
                <button onClick={() => workspace.setMode('simple')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${workspace.mode === 'simple' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="button-mode-simple">Simple</button>
                <button onClick={() => workspace.setMode('expert')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${workspace.mode === 'expert' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="button-mode-expert">Expert</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2.5 sm:hidden">
            <AssetSelect label="Short-term" value={workspace.shortTicker} options={workspace.assets?.shortTerm || []} onChange={workspace.setShortTicker} testId="select-mobile-short-asset" />
            <AssetSelect label="Long-term" value={workspace.longTicker} options={workspace.assets?.longTerm || []} onChange={workspace.setLongTicker} testId="select-mobile-long-asset" />
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">{children}</div>
      </main>
    </div>
  );
}

function AssetSelect({ label, value, options, onChange, testId }: { label: string; value: string; options: Asset[]; onChange: (v: string) => void; testId: string }) {
  return <label className="flex min-w-[154px] items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none" data-testid={testId}>{options.length ? options.map((a) => <option key={a.ticker} value={a.ticker}>{a.ticker}</option>) : <option value={value}>{value}</option>}</select></label>;
}

function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="reveal"><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"><span className="size-1.5 rounded-full bg-primary" />{eyebrow}</div><h1 className="max-w-3xl text-balance text-3xl font-extrabold tracking-[-0.045em] text-foreground sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</div>;
}

function Explain({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-5 text-foreground/80" data-testid="explanation-what-am-i-looking-at"><CircleHelp size={17} className="mt-0.5 shrink-0 text-primary" /><div><span className="font-semibold text-foreground">What am I looking at?</span><span className="ml-1">{children}</span></div></div>;
}

function LoadingState({ label = 'Reading market data' }: { label?: string }) {
  return <div className="space-y-3" data-testid="state-loading"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-3 sm:grid-cols-3"><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-20 animate-pulse rounded-xl bg-muted" /></div><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}…</p></div>;
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.05] p-6" data-testid="state-error"><div className="flex items-center gap-2 font-semibold"><Info size={17} className="text-destructive" />We couldn't load this analysis.</div><p className="mt-1 text-sm text-muted-foreground">The data service may be taking a breath. Try again in a moment.</p>{onRetry && <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground" data-testid="button-retry"><RefreshCw size={13} /> Retry</button>}</div>;
}

function MetricCard({ metric, expert }: { metric: Metric; expert: boolean }) {
  const positive = /good|low|strong|positive|healthy|stable|outperform/i.test(metric.rating);
  return <div className="rounded-xl border border-border bg-card p-4 transition-transform hover:-translate-y-0.5" data-testid={`card-metric-${metric.key}`}><div className="flex items-start justify-between gap-2"><span className="text-[11px] font-semibold text-muted-foreground">{metric.plainLabel}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${positive ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-accent-foreground'}`}>{metric.rating}</span></div><div className="mt-3 font-mono text-2xl font-medium tracking-[-0.05em]" data-testid={`text-metric-value-${metric.key}`}>{metric.formatted}</div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{metric.sentence}</p>{expert && <div className="mt-3 border-t border-border pt-2 font-mono text-[9px] text-muted-foreground/70">{metric.technicalName} · {metric.unit}</div>}</div>;
}

function Sparkline({ points, secondary, color = 'hsl(var(--primary))' }: { points: ChartPoint[]; secondary?: boolean; color?: string }) {
  if (!points?.length) return <div className="h-40 rounded-xl bg-muted" />;
  const values = points.map((p) => secondary && p.secondary !== undefined ? p.secondary : p.value);
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const coords = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${92 - ((v - min) / range) * 75}`).join(' ');
  return <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Time series chart" data-testid="chart-sparkline"><line x1="0" y1="92" x2="100" y2="92" stroke="hsl(var(--border))" strokeWidth=".5" /><polyline points={coords} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChartPanel({ title, caption, points, color, expert }: { title: string; caption: string; points: ChartPoint[]; color?: string; expert?: boolean }) {
  return <section className="rounded-2xl border border-border bg-card p-5" data-testid={`panel-chart-${title.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-start justify-between"><div><h3 className="font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div><LineChart size={17} className="text-muted-foreground" /></div><div className="mt-4"><Sparkline points={points} color={color} /></div>{expert && <div className="font-mono text-[9px] text-muted-foreground">n = {points?.length || 0} observations · normalized view</div>}</section>;
}

function Overview({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const params = { ticker: workspace.shortTicker, compareTicker: workspace.longTicker };
  const query = useGetOverview(params, { query: { queryKey: getGetOverviewQueryKey(params) } });
  return <><PageIntro eyebrow="Start here" title="A clearer read on your two-asset question." description="QuantLens turns the daily noise around an asset pair into a small set of decisions you can actually explain." /><Explain>Overview is your briefing: how each asset behaves, what the relationship means, and which caveat deserves your attention first.</Explain><div className="mt-6">{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : query.data ? <OverviewContent data={query.data} expert={workspace.mode === 'expert'} /> : <EmptyState label="Select two assets to start the briefing." />}</div></>;
}

function OverviewContent({ data, expert }: { data: any; expert: boolean }) {
  return <div className="space-y-5"><section className="ql-grid overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="grid gap-7 lg:grid-cols-[1fr_1.25fr] lg:items-center"><div className="reveal-1"><div className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: data.asset?.color }} /><span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{data.asset?.ticker} / {data.compareAsset?.ticker}</span></div><h2 className="mt-4 max-w-xl text-2xl font-bold tracking-[-0.04em] sm:text-3xl" data-testid="text-overview-headline">{data.summary?.headline}</h2><ul className="mt-4 space-y-2">{(data.summary?.bullets || []).map((b: string, i: number) => <li key={i} className="flex gap-2 text-sm leading-5 text-muted-foreground" data-testid={`text-overview-bullet-${i}`}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{b}</li>)}</ul></div><div><Sparkline points={data.series} color={data.asset?.color || 'hsl(var(--primary))'} /><div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><span>earlier</span><span>latest close</span></div></div></div></section><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(data.metrics || []).slice(0, 4).map((m: Metric) => <MetricCard key={m.key} metric={m} expert={expert} />)}</div><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Plain-English brief</h3><p className="mt-1 text-xs text-muted-foreground">The useful part, without the jargon.</p></div><Sparkles size={17} className="text-accent-foreground" /></div><div className="mt-4 divide-y divide-border">{(data.quickFacts || []).map((f: any, i: number) => <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-3" data-testid={`row-quick-fact-${i}`}><div><div className="text-sm font-semibold">{f.label}</div><div className="mt-0.5 text-xs text-muted-foreground">{f.detail}</div></div><div className="font-mono text-sm text-primary">{f.value}</div></div>)}</div></section><section className="rounded-2xl border border-border bg-secondary/55 p-5"><div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={16} className="text-primary" />Data note</div><p className="mt-3 text-sm leading-6 text-muted-foreground">Results use proxy series so beginners can compare familiar exposures without needing a brokerage connection.</p><div className="mt-4 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{data.dataSource || 'Proxy-adjusted daily history'}</div></section></div></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center" data-testid="state-empty"><Search size={22} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{label}</p></div>;
}

function Dna({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const [result, setResult] = useState<any>(null);
  const mutation = useRunDna();
  const run = () => mutation.mutate({ data: { ticker: workspace.shortTicker, compareTicker: workspace.longTicker } }, { onSuccess: setResult });
  return <><PageIntro eyebrow="Guided analysis" title="What is this pair really made of?" description="Strategy DNA decomposes a pair into trend, volatility, momentum, and relationship — then gives each part a human explanation." /><Explain>We are not changing the underlying data in Expert Mode. We are only showing the technical name and the extra reasoning behind each stage.</Explain><div className="mt-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]"><section className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current lens</div><div className="mt-4 space-y-3"><div className="rounded-xl border border-border p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Short-term</div><div className="mt-1 text-lg font-bold">{workspace.shortTicker}</div><p className="mt-1 text-xs text-muted-foreground">{assetTitle(workspace.shortAsset)}</p></div><div className="flex justify-center text-muted-foreground">+</div><div className="rounded-xl border border-border p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Long-term</div><div className="mt-1 text-lg font-bold">{workspace.longTicker}</div><p className="mt-1 text-xs text-muted-foreground">{assetTitle(workspace.longAsset)}</p></div></div><button onClick={run} disabled={mutation.isPending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60" data-testid="button-run-dna"><Zap size={16} />{mutation.isPending ? 'Reading the pair…' : result ? 'Refresh Strategy DNA' : 'Run Strategy DNA'}</button>{mutation.isError && <p className="mt-3 text-xs text-destructive" data-testid="text-dna-error">The analysis could not be completed. Try again.</p>}</section><section>{!result && !mutation.isPending ? <div className="flex h-full min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"><BrainCircuit size={28} className="text-primary" /><h3 className="mt-4 font-semibold">Your pair has a personality.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Run the guided analysis to see how the two assets work together, one stage at a time.</p></div> : mutation.isPending ? <LoadingState label="Building strategy DNA" /> : <DnaResult result={result} expert={workspace.mode === 'expert'} />}</section></div></>;
}

function DnaResult({ result, expert }: { result: any; expert: boolean }) {
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-4">{[['Risk grade', result.riskGrade], ['Trend', result.trend], ['Volatility', result.volatility], ['Momentum', result.momentum]].map(([label, value]) => <div key={label as string} className="rounded-xl border border-border bg-card p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-2 font-mono text-xl text-primary" data-testid={`text-dna-${String(label).toLowerCase().replace(' ', '-')}`}>{value}</div></div>)}</div><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">The four signals</h3><span className="font-mono text-xs text-primary">{result.riskScore}/100 risk</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{result.paragraph || result.riskSentence}</p><div className="mt-5 space-y-3">{(result.stages || []).map((stage: any, i: number) => <div key={stage.title} className="flex gap-3 rounded-xl border border-border p-3.5 reveal" style={{ animationDelay: `${i * 60}ms` }} data-testid={`row-dna-stage-${i}`}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{stage.title}</span><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">{stage.status}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>{expert && <p className="mt-1 font-mono text-[9px] text-muted-foreground/65">{stage.technical}</p>}</div></div>)}</div></section></div>;
}

function Analytics({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const query = useGetAnalytics({ ticker: workspace.shortTicker });
  const data: any = query.data;
  return <><PageIntro eyebrow="Deep dive" title="See the shape behind the headline." description={`Inspect ${workspace.shortTicker}'s return path, volatility, drawdowns, and rolling behavior.`} /><Explain>These charts are diagnostic, not predictive. They show how the asset behaved across the available history, so you can ask better questions about the future.</Explain><div className="mt-6">{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : data ? <div className="grid gap-5 lg:grid-cols-2"><ChartPanel title="Cumulative returns" caption="How a starting dollar grew over time." points={data.returns} color="hsl(var(--primary))" expert={workspace.mode === 'expert'} /><ChartPanel title="Volatility" caption="How loudly the asset moved from day to day." points={data.volatility} color="hsl(var(--accent-foreground))" expert={workspace.mode === 'expert'} /><ChartPanel title="Drawdown" caption="The distance from a previous high-water mark." points={data.drawdown} color="hsl(var(--destructive))" expert={workspace.mode === 'expert'} /><ChartPanel title="Rolling lens" caption="A moving view that smooths daily noise." points={data.rolling} color="hsl(var(--chart-3))" expert={workspace.mode === 'expert'} /><section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2"><h3 className="font-semibold">Month-by-month texture</h3><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">{(data.monthly || []).map((m: any, i: number) => <div key={i} className="space-y-1 text-center" data-testid={`bar-month-${i}`}><div className="flex h-20 items-end justify-center"><div className={`w-full max-w-5 rounded-t-sm ${m.value >= 0 ? 'bg-primary' : 'bg-destructive'}`} style={{ height: `${Math.max(8, Math.min(100, Math.abs(m.value) * 2))}%` }} /></div><div className="font-mono text-[9px] text-muted-foreground">{m.month}</div></div>)}</div></section></div> : <EmptyState label="No chart history is available for this asset yet." />}</div></>;
}

function Correlation({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const query = useGetCorrelation({ tickers: `${workspace.shortTicker},${workspace.longTicker}` });
  const data: any = query.data;
  return <><PageIntro eyebrow="Relationships" title="Do these two assets move together?" description="Correlation helps you understand whether combining the pair may diversify the journey — or simply duplicate it." /><Explain>A value near +1 means the assets often rose and fell together. Near 0 means the relationship was loose. Near −1 means they tended to move in opposite directions.</Explain><div className="mt-6">{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : data ? <div className="space-y-5"><section className="rounded-2xl border border-border bg-card p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{data.assets?.join(' × ')}</div><div className="mt-2 font-mono text-5xl tracking-[-0.08em] text-primary" data-testid="text-correlation-value">{Number(data.value).toFixed(2)}</div><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{data.sentence}</p></div><div className="relative h-4 w-full max-w-[340px] rounded-full bg-secondary"><div className="absolute left-1/2 top-[-4px] h-6 w-0.5 bg-foreground/30" /><div className="absolute top-0 h-4 rounded-full bg-primary" style={{ left: `${Math.max(0, Math.min(100, 50 + Number(data.value) * 50))}%`, width: '6px' }} /><div className="absolute -bottom-5 flex w-full justify-between font-mono text-[9px] text-muted-foreground"><span>−1 opposite</span><span>0 loose</span><span>+1 together</span></div></div></div></section><ChartPanel title="Rolling relationship" caption="The relationship can change as market regimes change." points={data.rolling} color="hsl(var(--primary))" expert={workspace.mode === 'expert'} /><section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-semibold">Return map</h3><p className="mt-1 text-xs text-muted-foreground">Each point is one shared observation. A tighter diagonal usually means stronger co-movement.</p><div className="mt-4 grid min-h-[220px] place-items-center rounded-xl border border-dashed border-border bg-secondary/30"><div className="relative size-44 border-b border-l border-muted-foreground/40"><span className="absolute -bottom-5 left-1/2 font-mono text-[9px] text-muted-foreground">{workspace.shortTicker} return</span><span className="absolute -left-12 top-1/2 -rotate-90 font-mono text-[9px] text-muted-foreground">{workspace.longTicker} return</span>{(data.scatter || []).map((p: any, i: number) => <i key={i} className="absolute size-1.5 rounded-full bg-primary/70" style={{ left: `${Math.max(2, Math.min(96, 50 + p.value * 120))}%`, bottom: `${Math.max(2, Math.min(96, 50 + (p.secondary || 0) * 120))}%` }} />)}</div></div></section></div> : <EmptyState label="Select a pair to read their relationship." />}</div></>;
}

function Backtest({ workspace, onRun }: { workspace: ReturnType<typeof useWorkspace>; onRun: (data: BacktestResult) => void }) {
  const mutation = useRunBacktest();
  const [strategy, setStrategy] = useState('sma');
  const [fast, setFast] = useState('20'); const [slow, setSlow] = useState('100');
  const run = () => mutation.mutate({ data: { ticker: workspace.shortTicker, compareTicker: workspace.longTicker, strategy, fast: Number(fast), slow: Number(slow), capital: 10000, feeBps: 5, slippageBps: 2 } }, { onSuccess: onRun });
  return <><PageIntro eyebrow="Test a strategy" title="Would this rule have held up?" description="A backtest is a disciplined way to interrogate an idea — never a promise that history will repeat." /><Explain>Choose one rule, keep the inputs visible, and read the result with its caveats. The simulation uses historical proxy data and includes trading friction.</Explain><div className="mt-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]"><section className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Test bench</div><label className="mt-5 block text-xs font-semibold">Strategy rule<select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="select-backtest-strategy"><option value="sma">Trend crossover</option><option value="ema">Stay above the line</option><option value="momentum">Buy what's rising</option><option value="mean">Buy the dips</option></select></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Fast window<input value={fast} onChange={(e) => setFast(e.target.value)} type="number" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-backtest-fast" /></label><label className="text-xs font-semibold">Slow window<input value={slow} onChange={(e) => setSlow(e.target.value)} type="number" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-backtest-slow" /></label></div><div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground"><div className="flex justify-between"><span>Starting capital</span><span className="font-mono text-foreground">$10,000</span></div><div className="mt-1 flex justify-between"><span>Friction</span><span className="font-mono text-foreground">7 bps / trade</span></div></div><button onClick={run} disabled={mutation.isPending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60" data-testid="button-run-backtest"><Play size={15} />{mutation.isPending ? 'Running the history…' : 'Run backtest'}</button></section><section>{mutation.isPending ? <LoadingState label="Testing your rule" /> : mutation.data ? <BacktestResultView result={mutation.data as any} expert={workspace.mode === 'expert'} /> : <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"><FlaskConical size={28} className="text-primary" /><h3 className="mt-4 font-semibold">History is a useful skeptic.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Run a rule against the selected asset to see returns, drawdown, trades, and the reasons not to over-trust them.</p></div>}</section></div></>;
}

function BacktestResultView({ result, expert }: { result: any; expert: boolean }) {
  return <div className="space-y-4"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{result.strategyName}</div><h2 className="mt-2 text-xl font-bold">{result.summary?.headline}</h2></div><div className="rounded-lg bg-primary/10 px-3 py-2 text-center"><div className="font-mono text-xl text-primary" data-testid="text-backtest-score">{result.verdict?.score}</div><div className="text-[9px] uppercase tracking-wider text-primary">confidence score</div></div></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{result.verdict?.sentence}</p></section><div className="grid gap-3 sm:grid-cols-3">{(result.metrics || []).slice(0, 3).map((m: Metric) => <MetricCard key={m.key} metric={m} expert={expert} />)}</div><ChartPanel title="Equity path" caption="Strategy against a simple invested benchmark." points={(result.equity || []).map((p: any) => ({ date: p.date, value: p.strategy, secondary: p.benchmark }))} color="hsl(var(--primary))" expert={expert} /><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck size={16} className="text-accent-foreground" /><h3 className="font-semibold">Reasons to stay humble</h3></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...(result.verdict?.opposing || []), ...(result.integrity || [])].slice(0, 4).map((s: string, i: number) => <div key={i} className="rounded-lg bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground" data-testid={`text-backtest-caveat-${i}`}>{s}</div>)}</div></section></div>;
}

function Simulation({ workspace, runId }: { workspace: ReturnType<typeof useWorkspace>; runId: string }) {
  const [trade, setTrade] = useState(0);
  const query = useGetSimulation(runId, { trade }, { query: { enabled: !!runId, queryKey: getGetSimulationQueryKey(runId, { trade }) } });
  const data: any = query.data;
  return <><PageIntro eyebrow="Trade timeline" title="Scrub through the decisions, one trade at a time." description="Simulation makes a strategy tangible: cash, exposure, and profit or loss at each point in the run." /><Explain>This is not a live trading screen. It is a microscope for understanding what the strategy actually did between its signals.</Explain><div className="mt-6">{!runId ? <EmptyState label="Run a backtest first. Its run ID will unlock the trade timeline." /> : query.isLoading ? <LoadingState label="Loading trade timeline" /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : data ? <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trade {data.tradeNumber}</div><h2 className="mt-2 text-2xl font-bold">{data.date}</h2></div><div className={`font-mono text-xl ${data.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>{data.pnl >= 0 ? '+' : ''}{data.pnl}</div></div><p className="mt-5 rounded-xl bg-secondary/60 p-4 text-sm leading-6 text-muted-foreground" data-testid="text-simulation-sentence">{data.sentence}</p><div className="mt-7"><input type="range" min="0" max="50" value={trade} onChange={(e) => setTrade(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" data-testid="input-simulation-trade" /><div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>start</span><span>trade {trade}</span><span>latest</span></div></div></section><section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Cash remaining</div><div className="mt-2 font-mono text-2xl" data-testid="text-simulation-cash">${Number(data.cash).toLocaleString()}</div></div><div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Invested</div><div className="mt-2 font-mono text-2xl">${Number(data.invested).toLocaleString()}</div></div><div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Pair under test</div><div className="mt-2 font-mono text-2xl text-primary">{workspace.shortTicker} + {workspace.longTicker}</div></div></section></div> : <EmptyState label="This simulation has no timeline data." />}</div></>;
}

function Compare({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const mutation = useCompareStrategies();
  const run = () => mutation.mutate({ data: { ticker: workspace.shortTicker, compareTicker: workspace.longTicker, capital: 10000 } });
  const data: any = mutation.data;
  return <><PageIntro eyebrow="Strategy lab" title="Put the rules side by side." description="A leaderboard is useful when it clarifies trade-offs, not when it crowns a permanent winner." /><Explain>Compare uses the same asset pair and capital across strategies. Look for the balance between return, risk, and how much trading the rule required.</Explain><div className="mt-6">{!data && !mutation.isPending ? <div className="rounded-2xl border border-border bg-card p-7"><div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Shared test conditions</div><h2 className="mt-2 text-xl font-bold">Same inputs. Different rules.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">QuantLens will compare the available strategy set on {workspace.shortTicker}, with {workspace.longTicker} as the reference asset.</p></div><button onClick={run} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="button-compare-strategies"><BarChart3 size={16} />Compare strategies</button></div></div> : mutation.isPending ? <LoadingState label="Ranking strategies" /> : <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current winner</div><h2 className="mt-1 text-xl font-bold text-primary" data-testid="text-compare-winner">{data.winner}</h2></div><button onClick={run} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" data-testid="button-refresh-comparison"><RefreshCw size={16} /></button></div><div className="divide-y divide-border">{(data.leaderboard || []).map((row: any, i: number) => <div key={row.strategy} className="grid gap-3 p-4 sm:grid-cols-[40px_1fr_auto_auto_auto] sm:items-center" data-testid={`row-leaderboard-${i}`}><span className={`grid size-8 place-items-center rounded-lg font-mono text-xs ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span><div><div className="font-semibold">{row.strategy}</div><div className="mt-1 text-xs text-muted-foreground">{row.sentence}</div></div><div><div className="font-mono text-sm text-primary">{row.return}</div><div className="text-[9px] uppercase text-muted-foreground">return</div></div><div><div className="font-mono text-sm">{row.risk}</div><div className="text-[9px] uppercase text-muted-foreground">risk</div></div><div><div className="font-mono text-sm">{row.trades}</div><div className="text-[9px] uppercase text-muted-foreground">trades</div></div></div>)}</div></section>}</div></>;
}

function About({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const glossaryQuery = useGetGlossary();
  const assetsQuery = workspace.assetsQuery;
  return <><PageIntro eyebrow="Field guide" title="A research terminal that speaks human." description="QuantLens is built for learning: the numbers stay rigorous, while every output earns its plain-English translation." /><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Info size={17} className="text-primary" /><h2 className="font-semibold">The reading order</h2></div><div className="mt-5 space-y-4">{[['01', 'Start with Overview', 'Get the broad shape before you reach for a chart.'], ['02', 'Question the relationship', 'Correlation is context, not a diversification certificate.'], ['03', 'Test one rule', 'A backtest is an experiment with assumptions, not evidence of certainty.'], ['04', 'Use Expert Mode carefully', 'Technical detail should sharpen your question, never replace your judgment.']].map(([n, t, d]) => <div key={n} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0"><span className="font-mono text-xs text-primary">{n}</span><div><h3 className="text-sm font-semibold">{t}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{d}</p></div></div>)}</div></section><section className="rounded-2xl border border-border bg-secondary/45 p-5 sm:p-7"><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Formula shelf</div><div className="mt-4 space-y-4 font-mono text-xs leading-6"><div><span className="text-primary">return</span> = (ending value / starting value) − 1</div><div><span className="text-primary">volatility</span> = spread of daily returns, annualized</div><div><span className="text-primary">drawdown</span> = current value − previous high</div><div><span className="text-primary">correlation</span> = shared direction, from −1 to +1</div></div></section></div><section className="mt-5 rounded-2xl border border-border bg-card p-5"><div className="flex items-end justify-between gap-3"><div><h2 className="font-semibold">Glossary</h2><p className="mt-1 text-xs text-muted-foreground">A compact translation layer for the words you will see most.</p></div><BookOpen size={17} className="text-muted-foreground" /></div>{glossaryQuery.isLoading ? <div className="mt-5 h-20 animate-pulse rounded-xl bg-muted" /> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(glossaryQuery.data || []).map((term: any, i: number) => <div key={term.technicalName} className="rounded-xl border border-border p-3" data-testid={`card-glossary-${i}`}><div className="text-sm font-semibold">{term.plainLabel}</div><div className="mt-1 font-mono text-[10px] text-primary">{term.technicalName}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{term.tooltip}</p></div>)}</div>}</section><section className="mt-5 rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Asset map</h2><p className="mt-1 text-xs text-muted-foreground">The proxy is the instrument QuantLens uses to make this exposure measurable.</p>{assetsQuery.isLoading ? <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted" /> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{(workspace.allAssets || []).map((asset, i) => <div key={asset.ticker} className="flex items-start gap-3 rounded-xl border border-border p-3" data-testid={`card-asset-${i}`}><span className="mt-1 size-2.5 rounded-full" style={{ backgroundColor: asset.color }} /><div><div className="font-mono text-sm">{asset.ticker}</div><div className="text-xs font-semibold">{asset.proxyName}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{asset.rationale}</p></div></div>)}</div>}</section></>;
}

function AppBody() {
  const workspace = useWorkspace();
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  return <Shell workspace={workspace}>{<Switch><Route path="/"><Overview workspace={workspace} /></Route><Route path="/dna"><Dna workspace={workspace} /></Route><Route path="/analytics"><Analytics workspace={workspace} /></Route><Route path="/correlation"><Correlation workspace={workspace} /></Route><Route path="/backtest"><Backtest workspace={workspace} onRun={(r) => { setBacktest(r); localStorage.setItem('ql-run-id', r.runId); }} /></Route><Route path="/simulation"><Simulation workspace={workspace} runId={backtest?.runId || localStorage.getItem('ql-run-id') || ''} /></Route><Route path="/compare"><Compare workspace={workspace} /></Route><Route path="/about"><About workspace={workspace} /></Route><Route component={NotFound} /></Switch>}</Shell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><RoutedErrorBoundary><AppBody /></RoutedErrorBoundary><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;