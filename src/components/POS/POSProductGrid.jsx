import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function POSProductGrid() {
  const { products, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter Categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Categories Pills */}
      <div className="px-4 md:px-6 py-2.5 sm:py-3 border-b bg-white flex space-x-2 overflow-x-auto no-scrollbar shrink-0 shadow-sm z-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedCategory === cat 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-primary-hover/5 hover:text-primary hover:border-primary/20 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map(product => (
            <div
              key={product._id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col relative animate-in fade-in zoom-in"
            >
              {/* Stock indicator badge */}
              {product.stock <= 10 && (
                  <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                    Low Stock
                  </span>
              )}
              
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                   {product.category}
                </div>
                <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">{product.name}</h3>
                <div className="text-xs text-gray-500 font-mono space-y-0.5 mb-4">
                   <div>BC: {product.barcode}</div>
                   {product.serialNo && <div>SN: {product.serialNo}</div>}
                </div>
              </div>

              <div className="flex flex-col mt-auto pt-3 border-t border-gray-100">
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-1">
                     Stock: <span className="font-medium text-gray-900">{product.stock}</span>
                  </div>
                  <p className="text-primary font-bold text-sm sm:text-lg leading-none">₹{product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full h-full flex flex-col justify-center items-center text-gray-400 py-20">
                <MagnifyingGlassIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No products in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSProductGrid;
