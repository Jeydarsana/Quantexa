import React, { useState } from 'react';

interface GlossaryTermProps {
  term: string;
  definition: string;
  simpleLabel?: string;
  isSimpleMode: boolean;
}

export default function GlossaryTerm({ term, definition, simpleLabel, isSimpleMode }: GlossaryTermProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const displayTerm = isSimpleMode && simpleLabel ? simpleLabel : term;

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="border-b border-dashed border-textMuted cursor-help hover:text-white transition-colors">
        {displayTerm}
      </span>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface border border-border rounded-xl shadow-xl z-50 text-xs text-white font-normal leading-relaxed text-center">
          <div className="font-bold text-secondary mb-1">{term}</div>
          {definition}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border"></div>
        </div>
      )}
    </div>
  );
}
