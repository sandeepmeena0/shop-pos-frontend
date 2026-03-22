import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePOS } from '../../context/POSContext';

function POSSearch() {
  const { products, addToCart } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter for search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.serialNo && p.serialNo.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  // Reset selection index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    if (val.trim() === '') {
        setIsDropdownOpen(false);
        return;
    }

    setIsDropdownOpen(true);

    // Exact barcode match auto-add
    const exactMatch = products.find(p => p.barcode === val);
    if (exactMatch) {
       addToCart(exactMatch);
       setSearchTerm(''); 
       setIsDropdownOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      if (!isDropdownOpen && searchResults.length > 0) {
        setIsDropdownOpen(true);
      } else {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && searchResults.length > 0) {
        handleSelectProduct(searchResults[selectedIndex]);
      }
    }
  };

  const handleSelectProduct = (product) => {
      addToCart(product);
      setSearchTerm('');
      setIsDropdownOpen(false);
      // We don't need to force focus back because we never technically lost it
  };

  return (
    <div
      className={`z-50 transition-all duration-200 ${
        isMobileFocused
          ? 'fixed top-2 left-3 right-3 sm:relative sm:top-auto sm:left-auto sm:right-auto sm:w-full'
          : 'relative w-full'
      }`}
      ref={containerRef}
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsMobileFocused(true);
          if (searchTerm.trim()) setIsDropdownOpen(true);
        }}
        onBlur={() => {
          // Delay so clicks on results register first
          setTimeout(() => setIsMobileFocused(false), 200);
        }}
        placeholder="Search product..."
        className="block w-full pl-9 pr-8 py-2 border border-gray-300 shadow-sm rounded-lg text-sm leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
      />
      {searchTerm && (
        <button 
          onClick={() => { setSearchTerm(''); setIsDropdownOpen(false); }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Search Dropdown */}
      {isDropdownOpen && searchResults.length > 0 && (
         <div className="absolute mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-y-auto no-scrollbar ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <ul className="py-2">
               {searchResults.map((product, index) => (
                  <li 
                     key={product._id}
                     onClick={() => handleSelectProduct(product)}
                     onMouseEnter={() => setSelectedIndex(index)}
                     className={`px-4 py-3.5 cursor-pointer flex justify-between items-center transition-all ${
                       index === selectedIndex ? 'bg-primary text-white shadow-lg scale-[1.01] rounded-lg mx-2' : 'hover:bg-gray-50 text-gray-900 border-b border-gray-50 last:border-0'
                     }`}
                  >
                     <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                        <div className={`text-[10px] mt-0.5 font-mono ${index === selectedIndex ? 'text-white/70' : 'text-gray-400'}`}>
                           {product.barcode && <span className="mr-3">BC: {product.barcode}</span>}
                           {product.category && <span className="uppercase">{product.category}</span>}
                        </div>
                     </div>
                     <div className="flex items-center gap-4 shrink-0 pl-4">
                        <div className="text-right">
                          <div className={`font-black text-lg ${index === selectedIndex ? 'text-white' : 'text-primary'}`}>₹{product.price.toFixed(2)}</div>
                          <div className={`text-[10px] uppercase font-bold ${index === selectedIndex ? 'text-white/60' : 'text-gray-400'}`}>
                            {product.stock} in stock
                          </div>
                        </div>
                        {index === selectedIndex && (
                          <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black tracking-widest">ENTER</div>
                        )}
                     </div>
                  </li>
               ))}
            </ul>
         </div>
      )}
      
      {isDropdownOpen && searchResults.length === 0 && searchTerm.length > 0 && (
         <div className="absolute mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl p-6 text-center z-50 animate-in fade-in slide-in-from-top-2">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium italic">No products found matching "{searchTerm}"</p>
         </div>
      )}
    </div>
  );
}

export default POSSearch;
