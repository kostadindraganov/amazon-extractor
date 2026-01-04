
import React from 'react';
import { AmazonProduct } from '../types.ts';

interface ProductCardProps {
  product: AmazonProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-slate-800 text-slate-400">Waiting</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-amber-900/50 text-amber-400 animate-pulse">Processing</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-emerald-900/50 text-emerald-400">Success</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-rose-900/50 text-rose-400">Error</span>;
    }
  };

  const hasImages = product.status === 'completed' && product.extractedImages.length > 0;

  return (
    <div className="glass rounded-2xl p-5 flex flex-col h-full group hover:border-sky-500/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow pr-2 overflow-hidden">
          <h3 className="font-semibold text-slate-100 text-sm truncate leading-tight" title={product.title || product.url}>
            {product.title || "Pending Extraction..."}
          </h3>
          <a 
            href={product.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] text-sky-400 hover:underline truncate block mt-1 opacity-70"
          >
            {product.url}
          </a>
        </div>
        {getStatusBadge()}
      </div>

      <div className="relative flex-grow min-h-[180px] bg-slate-900/80 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800/50">
        {hasImages ? (
          <div className="grid grid-cols-2 gap-1.5 p-1.5 w-full h-full">
            {product.extractedImages.slice(0, 4).map((img, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden bg-white/5 rounded-lg">
                <img 
                  src={img} 
                  alt={`Product view ${idx + 1}`} 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150?text=Error';
                  }}
                />
              </div>
            ))}
            {product.extractedImages.length > 4 && (
              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300 font-bold">
                +{product.extractedImages.length - 4} More
              </div>
            )}
          </div>
        ) : product.status === 'processing' ? (
          <div className="flex flex-col items-center p-6 text-center">
             <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-[11px] text-slate-400 font-medium">Gemini is searching for product images...</p>
          </div>
        ) : product.status === 'failed' ? (
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[11px] text-rose-400 font-semibold mb-1">Extraction Failed</p>
            <p className="text-[10px] text-slate-500 line-clamp-2">{product.error || "No images found for this product."}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-40">
            <svg className="w-12 h-12 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">
              Ready to Scan
            </div>
          </div>
        )}
      </div>

      {product.sources && product.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1 h-1 bg-sky-500 rounded-full"></div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Verified via:</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {product.sources.slice(0, 3).map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] bg-slate-800/80 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-md transition-colors max-w-full truncate border border-slate-700/50"
              >
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;