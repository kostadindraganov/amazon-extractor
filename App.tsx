
import React, { useState } from 'react';
import { SheetData, AmazonProduct } from './types';
import { SheetService } from './services/sheetService';
import { GeminiService } from './services/geminiService';
import Dashboard from './components/Dashboard';

const DEFAULT_SHEET = "https://docs.google.com/spreadsheets/d/1f1k44wG4D8IEt71UNAD-7_GKGkssgLEi/edit?gid=2110124607#gid=2110124607";

const App: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);

  const findAmazonColumn = (headers: string[], rows: Record<string, string>[]) => {
    const keywords = ['AMAZON', 'LINK', 'URL', 'PRODUCT', 'ASIN'];
    const candidates = headers.filter(h => keywords.some(kw => h.toUpperCase().includes(kw)));
    for (const col of candidates) {
      const hasUrl = rows.some(r => {
        const val = String(r[col] || '').toLowerCase();
        return val.includes('amazon') || val.includes('amzn') || val.includes('a.co') || val.includes('/dp/');
      });
      if (hasUrl) return col;
    }
    for (const header of headers) {
      const hasUrl = rows.some(r => {
        const val = String(r[header] || '').toLowerCase();
        return val.includes('amazon') || val.includes('amzn') || val.includes('a.co') || val.includes('/dp/');
      });
      if (hasUrl) return header;
    }
    return headers[0] || '';
  };

  const findPaletteColumn = (headers: string[]) => {
    return headers.find(h => {
      const upper = h.toUpperCase();
      return upper.includes('PALETTE') || upper.includes('PALETE') || upper.includes('GROUP') || upper.includes('ITEM');
    }) || '';
  };

  const handleLoadSheet = async () => {
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setSheetData(null);
    
    try {
      const data = await SheetService.fetchSheet(sheetUrl);
      setSheetData(data);
      
      const detectedColumn = findAmazonColumn(data.headers, data.rows);
      setSelectedColumn(detectedColumn);
      mapProducts(data.rows, detectedColumn, findPaletteColumn(data.headers));
    } catch (err: any) {
      setError(err.message || "Failed to load spreadsheet.");
    } finally {
      setIsLoading(false);
    }
  };

  const mapProducts = (rows: Record<string, string>[], linkCol: string, paletteCol: string) => {
    const mapped = rows
      .map((row, idx) => ({
        id: `product-${idx}`,
        url: row[linkCol]?.trim() || '',
        palette: paletteCol ? row[paletteCol]?.trim() : undefined,
        status: 'pending' as const,
        extractedImages: [],
      }))
      .filter(p => {
        const u = p.url.toLowerCase();
        return u.includes('amazon') || u.includes('amzn') || u.includes('a.co') || u.includes('/dp/') || u.includes('/gp/');
      });
    
    setProducts(mapped);
    if (mapped.length === 0) {
      setError(`No valid Amazon links found in column: "${linkCol}".`);
    } else {
      setError(null);
    }
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const col = e.target.value;
    setSelectedColumn(col);
    if (sheetData) mapProducts(sheetData.rows, col, findPaletteColumn(sheetData.headers));
  };

  const processProduct = async (product: AmazonProduct) => {
    const gemini = new GeminiService();
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'processing' } : p));
    try {
      const result = await gemini.extractProductInfo(product.url);
      setProducts(prev => prev.map(p => p.id === product.id ? { 
        ...p, 
        status: 'completed', 
        extractedImages: result.images,
        title: result.title,
        sources: result.sources
      } : p));
    } catch (err: any) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'failed', error: err.message || "Extraction failed" } : p));
    }
  };

  const startExtraction = async () => {
    if (isExtracting) return;
    setIsExtracting(true);
    const pending = products.filter(p => p.status === 'pending');
    const batchSize = 2; // Reduced slightly for better stability
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      await Promise.all(batch.map(product => processProduct(product)));
    }
    setIsExtracting(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-text">Amazon Image Harvester</h1>
        <p className="text-slate-400">Extract high-quality product imagery automatically grouped by Palette.</p>
      </header>

      <main className="w-full max-w-6xl space-y-8">
        <div className="glass rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
              className="flex-grow bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-500 text-slate-200 outline-none"
            />
            <button
              onClick={handleLoadSheet}
              disabled={isLoading}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              {isLoading ? "Loading..." : "Load Data"}
            </button>
          </div>

          {sheetData && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                <label className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Product Link Column:</label>
                <select 
                  value={selectedColumn}
                  onChange={handleColumnChange}
                  className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  {sheetData.headers.map((h, i) => (
                    <option key={i} value={h}>{h || `Column ${i+1}`}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-rose-900/20 border border-rose-900/50 p-4 rounded-2xl">
              <span className="text-rose-500 font-bold">!</span>
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Ready for Processing</h2>
                <p className="text-slate-500 text-sm">{products.length} products detected.</p>
              </div>
              <button
                onClick={startExtraction}
                disabled={isExtracting}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
              >
                {isExtracting ? "Extracting..." : "Start AI Extraction"}
              </button>
            </div>

            <Dashboard products={products} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
