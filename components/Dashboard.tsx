
import React, { useMemo } from 'react';
import { AmazonProduct } from '../types.ts';
import ProductCard from './ProductCard.tsx';

interface DashboardProps {
  products: AmazonProduct[];
}

const Dashboard: React.FC<DashboardProps> = ({ products }) => {
  const groupedProducts = useMemo(() => {
    const groups: Record<string, AmazonProduct[]> = {};
    products.forEach(p => {
      const key = p.palette || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [products]);

  return (
    <div className="space-y-12">
      {/* Explicitly cast the entries array to handle TypeScript's default inference of values as 'unknown' */}
      {(Object.entries(groupedProducts) as [string, AmazonProduct[]][]).map(([palette, groupProducts]) => (
        <section key={palette} className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-sky-400 bg-sky-900/20 px-4 py-2 rounded-xl border border-sky-500/30">
              {palette.startsWith('Palette') ? palette : `Palette ${palette}`}
            </h3>
            <div className="h-[1px] flex-grow bg-slate-800"></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {groupProducts.length} Items
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Dashboard;