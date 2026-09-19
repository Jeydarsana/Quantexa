import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';
import { ALL_ASSETS, getAssetMeta } from '../constants/assets';

interface AssetSelectorProps {
  value: string;
  onChange: (ticker: string) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export default function AssetSelector({
  value,
  onChange,
  label,
  className = '',
  compact = false
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentAsset = useMemo(() => getAssetMeta(value), [value]);

  const cleanQuery = searchQuery.trim().toUpperCase();
  const exactMatchExists = ALL_ASSETS.some(a => a.ticker.toUpperCase() === cleanQuery);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_ASSETS.filter((asset) => {
      const matchesCat = selectedCategory === 'All' || asset.category === selectedCategory;
      if (!q) return matchesCat;
      const matchesSearch =
        asset.ticker.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSelect = (ticker: string) => {
    const norm = ticker.trim().toUpperCase();
    if (!norm) return;
    onChange(norm);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-textMuted mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-background border rounded-lg px-3 text-left transition-all cursor-pointer flex items-center justify-between shadow-sm ${
          compact ? 'h-[42px] py-1.5' : 'py-2'
        } ${
          isOpen
            ? 'border-primary ring-1 ring-primary/40 bg-surface'
            : 'border-border hover:border-gray-500'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{currentAsset.icon}</span>
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm font-mono tracking-tight">
              {currentAsset.ticker}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-primary/20 text-primary border border-primary/30">
              {currentAsset.category}
            </span>
            {!compact && (
              <span className="text-xs text-textMuted truncate hidden sm:inline">
                - {currentAsset.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <ChevronDown className={`w-4 h-4 text-textMuted transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-full min-w-[300px] max-w-sm bg-[#121826] border border-border/90 rounded-xl shadow-2xl p-3 backdrop-blur-xl animate-in fade-in duration-100">
          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cleanQuery) {
                  if (filteredAssets.length === 1) {
                    handleSelect(filteredAssets[0].ticker);
                  } else {
                    handleSelect(cleanQuery);
                  }
                }
              }}
              placeholder="Search or type ticker (e.g. AMZN, META, PLTR)..."
              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-textMuted outline-none font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Ticker Direct Entry Option */}
          {cleanQuery.length > 0 && !exactMatchExists && (
            <div className="mb-2 p-2 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-white">
                  Use custom: <span className="font-mono font-bold bg-primary px-1.5 py-0.5 rounded text-white">{cleanQuery}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelect(cleanQuery)}
                className="px-2 py-0.5 bg-primary hover:bg-primaryHover text-white rounded text-[11px] font-semibold cursor-pointer"
              >
                Select
              </button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-1 mb-2 p-1 bg-background rounded-md border border-border overflow-x-auto text-[10px]">
            {['All', 'Equities', 'Crypto', 'Commodities', 'Indices/ETFs'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textMuted hover:text-white'
                }`}
              >
                {cat === 'Indices/ETFs' ? 'ETFs' : cat}
              </button>
            ))}
          </div>

          {/* Scrollable Assets List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredAssets.length === 0 ? (
              <div className="py-4 text-center text-textMuted text-xs">
                No presets found.
                {cleanQuery && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => handleSelect(cleanQuery)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Select "{cleanQuery}" as custom ticker
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = value.toUpperCase() === asset.ticker.toUpperCase();
                return (
                  <button
                    key={asset.ticker}
                    type="button"
                    onClick={() => handleSelect(asset.ticker)}
                    className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-surface/50 hover:bg-surface border-border/50 hover:border-border text-textMuted hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base flex-shrink-0">{asset.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono text-xs">
                            {asset.ticker}
                          </span>
                          <span className="text-[9px] uppercase px-1 rounded bg-background text-textMuted font-semibold">
                            {asset.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-textMuted truncate">
                          {asset.name}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
