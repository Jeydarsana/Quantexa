/**
 * Zero-dependency pure JavaScript PDF Generator for Investment Analysis Reports.
 * Produces standard, valid PDF 1.4 binary documents directly in browser memory.
 */

export interface ReportData {
  assetInfo: {
    ticker: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string;
    entryPrice: number;
    exitPrice: number;
    priceChangePct: number;
  };
  riskMetrics: {
    annualizedVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskLevel: string;
    valueAtRisk95?: number;
    sortinoRatio?: number;
  };
  strategyAnalysis: {
    strategy: string;
    totalTrades: number;
    strategyReturn: number;
    benchmarkReturn: number;
  };
  portfolioSimulation: {
    cashBalance: number;
    selectedAsset: string;
    quantity: number;
    tradingCost: number;
    entryPrice: number;
    exitPrice: number;
    investmentAmount: number;
    grossProfitLoss?: number;
    netProfitLoss: number;
    returnPct: number;
    finalPortfolioValue: number;
    riskLevel: string;
  };
  reasons: Array<{ factor: string; status: string; detail: string }>;
  investmentAssessment: {
    badge: string;
    color: string;
    narrative: string;
  };
  analysisDate?: string;
}

function sanitizeText(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function generateInvestmentReportPDF(data: ReportData): void {
  const dateStr = data.analysisDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const lines: string[] = [];

  // Helper for drawing shapes
  const drawRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    lines.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`);
    lines.push(`${x} ${y} ${w} ${h} re f`);
  };

  const drawStrokeRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    lines.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} RG`);
    lines.push(`0.75 w`);
    lines.push(`${x} ${y} ${w} ${h} re S`);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, r = 0.8, g = 0.8, b = 0.8) => {
    lines.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} RG`);
    lines.push(`0.5 w`);
    lines.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // Helper for text rendering
  const addText = (text: string, x: number, y: number, font: 'F1' | 'F2' = 'F1', size = 10, r = 0.1, g = 0.1, b = 0.1) => {
    lines.push(`BT`);
    lines.push(`/${font} ${size} Tf`);
    lines.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`);
    lines.push(`${x} ${y} Td`);
    lines.push(`(${sanitizeText(text)}) Tj`);
    lines.push(`ET`);
  };

  // Header Banner
  drawRect(36, 730, 540, 48, 0.08, 0.12, 0.22); // Dark navy header
  addText('QUANTLENS | INVESTMENT ANALYSIS & SIMULATION REPORT', 48, 756, 'F2', 13, 1, 1, 1);
  addText(`Generated: ${dateStr}  |  Educational & Analytical Platform`, 48, 740, 'F1', 8, 0.7, 0.75, 0.85);

  // Asset Overview Box
  drawRect(36, 650, 540, 68, 0.96, 0.97, 0.98);
  drawStrokeRect(36, 650, 540, 68, 0.85, 0.88, 0.92);
  
  addText('1. ASSET PROFILE & HISTORICAL OVERVIEW', 46, 702, 'F2', 9, 0.2, 0.3, 0.5);
  addText(`Selected Asset: ${data.assetInfo.name} (${data.assetInfo.ticker})`, 46, 686, 'F2', 10, 0.1, 0.1, 0.1);
  addText(`Asset Class: ${data.assetInfo.category}`, 46, 672, 'F1', 9, 0.3, 0.3, 0.3);
  addText(`Period: ${data.assetInfo.startDate} to ${data.assetInfo.endDate}`, 46, 658, 'F1', 9, 0.3, 0.3, 0.3);

  addText(`Entry Price: $${data.assetInfo.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 330, 686, 'F1', 9, 0.2, 0.2, 0.2);
  addText(`Exit Price:  $${data.assetInfo.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 330, 672, 'F1', 9, 0.2, 0.2, 0.2);
  const changeColor = data.assetInfo.priceChangePct >= 0 ? [0.05, 0.55, 0.3] : [0.75, 0.1, 0.1];
  addText(`Price Change: ${data.assetInfo.priceChangePct >= 0 ? '+' : ''}${data.assetInfo.priceChangePct.toFixed(2)}%`, 330, 658, 'F2', 9, changeColor[0], changeColor[1], changeColor[2]);

  // Risk & Strategy Box
  drawRect(36, 560, 540, 78, 0.98, 0.98, 0.99);
  drawStrokeRect(36, 560, 540, 78, 0.85, 0.88, 0.92);

  addText('2. STRATEGY DNA & RISK METRICS', 46, 622, 'F2', 9, 0.2, 0.3, 0.5);
  addText(`Strategy Tested: ${data.strategyAnalysis.strategy.replace(/_/g, ' ')}`, 46, 606, 'F2', 10, 0.1, 0.1, 0.1);
  addText(`Strategy Return: ${(data.strategyAnalysis.strategyReturn * 100).toFixed(2)}%`, 46, 592, 'F1', 9, 0.2, 0.2, 0.2);
  addText(`Benchmark Return: ${(data.strategyAnalysis.benchmarkReturn * 100).toFixed(2)}%`, 46, 578, 'F1', 9, 0.3, 0.3, 0.3);
  addText(`Total Executed Trades: ${data.strategyAnalysis.totalTrades}`, 46, 566, 'F1', 8, 0.4, 0.4, 0.4);

  // Risk values
  addText(`Annualized Volatility: ${(data.riskMetrics.annualizedVolatility * 100).toFixed(2)}%`, 330, 606, 'F1', 9, 0.2, 0.2, 0.2);
  addText(`Sharpe Ratio: ${data.riskMetrics.sharpeRatio.toFixed(2)}`, 330, 592, 'F1', 9, 0.2, 0.2, 0.2);
  addText(`Maximum Drawdown: ${(data.riskMetrics.maxDrawdown * 100).toFixed(2)}%`, 330, 578, 'F1', 9, 0.2, 0.2, 0.2);
  
  // Risk Badge
  const rLvl = data.riskMetrics.riskLevel.toUpperCase();
  const rColor = rLvl === 'LOW' ? [0.05, 0.55, 0.3] : rLvl === 'MEDIUM' ? [0.8, 0.5, 0.0] : [0.75, 0.1, 0.1];
  drawRect(470, 588, 90, 20, rColor[0], rColor[1], rColor[2]);
  addText(`RISK: ${rLvl}`, 482, 594, 'F2', 8, 1, 1, 1);

  // Portfolio Simulation Table
  drawRect(36, 395, 540, 150, 0.98, 0.98, 1.0);
  drawStrokeRect(36, 395, 540, 150, 0.85, 0.88, 0.92);
  addText('3. PORTFOLIO SIMULATION RESULTS (TRADING FEES DEDUCTED)', 46, 530, 'F2', 9, 0.2, 0.3, 0.5);

  const simRows = [
    ['Initial Cash Balance', `$${data.portfolioSimulation.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Selected Asset', data.portfolioSimulation.selectedAsset],
    ['Investment Amount', `$${data.portfolioSimulation.investmentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Simulated Quantity', `${data.portfolioSimulation.quantity.toFixed(4)} units`],
    ['Entry Price', `$${data.portfolioSimulation.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Exit Price', `$${data.portfolioSimulation.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Total Trading Fees', `-$${data.portfolioSimulation.tradingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Simulated Risk Level', data.portfolioSimulation.riskLevel],
    [
      'Net Profit / Loss',
      `${data.portfolioSimulation.netProfitLoss >= 0 ? '+' : ''}$${data.portfolioSimulation.netProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      'Net Return %',
      `${data.portfolioSimulation.returnPct >= 0 ? '+' : ''}${data.portfolioSimulation.returnPct.toFixed(2)}%`
    ],
    ['Final Portfolio Value', `$${data.portfolioSimulation.finalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Execution Status', 'Completed']
  ];

  let simY = 508;
  simRows.forEach((row, idx) => {
    if (idx === 4) {
      // Highlight Net P/L row
      const isProf = data.portfolioSimulation.netProfitLoss >= 0;
      drawRect(42, simY - 3, 528, 16, isProf ? 0.92 : 0.98, isProf ? 0.98 : 0.92, isProf ? 0.94 : 0.92);
      addText(row[0], 48, simY + 2, 'F2', 9, 0.1, 0.1, 0.1);
      addText(row[1], 170, simY + 2, 'F2', 9, isProf ? 0.05 : 0.75, isProf ? 0.55 : 0.1, isProf ? 0.3 : 0.1);
      addText(row[2], 300, simY + 2, 'F2', 9, 0.1, 0.1, 0.1);
      addText(row[3], 430, simY + 2, 'F2', 9, isProf ? 0.05 : 0.75, isProf ? 0.55 : 0.1, isProf ? 0.3 : 0.1);
    } else {
      drawLine(42, simY - 3, 570, simY - 3, 0.9, 0.92, 0.94);
      addText(row[0], 48, simY + 2, 'F1', 8.5, 0.3, 0.3, 0.3);
      addText(row[1], 170, simY + 2, 'F2', 8.5, 0.15, 0.15, 0.15);
      addText(row[2], 300, simY + 2, 'F1', 8.5, 0.3, 0.3, 0.3);
      addText(row[3], 430, simY + 2, 'F2', 8.5, 0.15, 0.15, 0.15);
    }
    simY -= 18;
  });

  // Dynamic Reasons for Profit or Loss
  drawRect(36, 255, 540, 128, 0.98, 0.98, 0.98);
  drawStrokeRect(36, 255, 540, 128, 0.85, 0.88, 0.92);
  const isLoss = data.portfolioSimulation.netProfitLoss < 0;
  const reasonTitle = isLoss ? '4. WHY THE INVESTMENT RESULTED IN A LOSS (QUANTITATIVE REASONS)' : '4. WHY THE INVESTMENT GENERATED PROFIT (QUANTITATIVE REASONS)';
  addText(reasonTitle, 46, 368, 'F2', 9, isLoss ? 0.75 : 0.1, isLoss ? 0.1 : 0.55, isLoss ? 0.1 : 0.25);

  let rY = 352;
  const displayReasons = data.reasons.slice(0, 4);
  displayReasons.forEach((r, i) => {
    addText(`* [${r.factor}]:`, 48, rY, 'F2', 8, 0.2, 0.2, 0.2);
    // Wrap details into 75 characters approx
    const detail = r.detail.length > 95 ? r.detail.substring(0, 92) + '...' : r.detail;
    addText(detail, 155, rY, 'F1', 8, 0.25, 0.25, 0.25);
    rY -= 17;
  });

  // Investment Assessment Box
  drawRect(36, 120, 540, 122, 0.95, 0.96, 0.98);
  drawStrokeRect(36, 120, 540, 122, 0.82, 0.85, 0.90);
  addText('5. FORMAL INVESTMENT ASSESSMENT', 46, 226, 'F2', 9, 0.2, 0.3, 0.5);

  const assessBadge = data.investmentAssessment.badge;
  const badgeCol = assessBadge.includes('Potentially') ? [0.05, 0.55, 0.3] : assessBadge.includes('Caution') ? [0.8, 0.5, 0.0] : [0.75, 0.1, 0.1];
  drawRect(46, 198, 230, 20, badgeCol[0], badgeCol[1], badgeCol[2]);
  addText(assessBadge.toUpperCase(), 56, 204, 'F2', 8.5, 1, 1, 1);

  // Assessment Narrative text wrapping
  const narrative = data.investmentAssessment.narrative;
  const words = narrative.split(' ');
  const linesArr: string[] = [];
  let curLine = '';
  for (const w of words) {
    if ((curLine + w).length > 95) {
      linesArr.push(curLine.trim());
      curLine = w + ' ';
    } else {
      curLine += w + ' ';
    }
  }
  if (curLine.trim()) linesArr.push(curLine.trim());

  let narrY = 184;
  linesArr.slice(0, 4).forEach(l => {
    addText(l, 46, narrY, 'F1', 8, 0.2, 0.2, 0.2);
    narrY -= 12;
  });

  // Regulatory Disclaimer (Exact user requirement)
  drawRect(36, 40, 540, 68, 0.92, 0.93, 0.95);
  drawStrokeRect(36, 40, 540, 68, 0.80, 0.82, 0.86);
  addText('REGULATORY & ANALYTICAL DISCLAIMER', 46, 92, 'F2', 7.5, 0.4, 0.4, 0.4);
  addText('Historical simulation is for educational and analytical purposes only. Past performance does not guarantee future results', 46, 78, 'F1', 7, 0.35, 0.35, 0.35);
  addText('and this platform does not provide personalized financial advice.', 46, 68, 'F1', 7, 0.35, 0.35, 0.35);
  addText('QuantLens Multi-Asset Platform  |  All calculations include dynamic transaction fee deductions.', 46, 52, 'F2', 7, 0.45, 0.45, 0.45);

  // Assemble PDF stream
  const contentStream = lines.join('\n');
  const streamLength = contentStream.length;

  const pdfObjects = [
    // 1: Catalog
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    // 2: Pages
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    // 3: Page (US Letter: 612 x 792 pt)
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    // 4: Regular Font (Helvetica)
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    // 5: Bold Font (Helvetica-Bold)
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
    // 6: Page Contents Stream
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  ];

  let offset = 0;
  const header = '%PDF-1.4\n';
  offset += header.length;

  const xrefEntries: number[] = [0];
  for (const obj of pdfObjects) {
    xrefEntries.push(offset);
    offset += obj.length;
  }

  const startxref = offset;
  let xref = `xref\n0 ${pdfObjects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= pdfObjects.length; i++) {
    const oStr = xrefEntries[i].toString().padStart(10, '0');
    xref += `${oStr} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const fullPdf = header + pdfObjects.join('') + xref + trailer;

  // Trigger download via Blob
  const blob = new Blob([fullPdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `QuantLens_Investment_Report_${data.assetInfo.ticker}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
