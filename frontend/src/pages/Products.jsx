import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Filter, 
  Sparkles, 
  MapPin, 
  Layers, 
  Tag, 
  IndianRupee, 
  Star, 
  Inbox,
  Heart
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';


const Products = ({ searchQuery }) => {
  const { user, authenticatedFetch, updateWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Data states
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [shops, setShops] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user?.wishlist) {
      setWishlist(user.wishlist);
    } else {
      setWishlist([]);
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    const isSaved = wishlist.includes(productId);
    try {
      const endpoint = isSaved ? `/users/wishlist/${productId}` : `/users/wishlist`;
      const method = isSaved ? 'DELETE' : 'POST';
      const body = isSaved ? undefined : JSON.stringify({ productId });
      
      const res = await authenticatedFetch(endpoint, {
        method,
        body
      });
      if (res.ok) {
        const updatedWishlist = await res.json();
        setWishlist(updatedWishlist);
        updateWishlist(updatedWishlist);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedShop, setSelectedShop] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [cartError, setCartError] = useState({});

  // Dynamic lists derived for filter dropdowns
  const [categoriesList, setCategoriesList] = useState(['All']);
  const [brandsList, setBrandsList] = useState(['All']);

  // Fetch Shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await authenticatedFetch('/shops');
        if (response.ok) {
          const data = await response.json();
          setShops(data);
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Products with Filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/products?`;
        const params = new URLSearchParams();
        
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        if (selectedBrand && selectedBrand !== 'All') {
          params.append('brand', selectedBrand);
        }
        if (selectedShop && selectedShop !== 'All') {
          params.append('shopId', selectedShop);
        }
        if (priceRange.min) {
          params.append('priceMin', priceRange.min);
        }
        if (priceRange.max) {
          params.append('priceMax', priceRange.max);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await authenticatedFetch(url + params.toString());
        if (response.ok) {
          const data = await response.json();
          setProducts(data);

          // Build dynamic unique categories and brands list from original dataset if first load
          if (selectedCategory === 'All' && selectedBrand === 'All' && selectedShop === 'All' && !priceRange.min && !priceRange.max && !searchQuery) {
            const cats = ['All', ...new Set(data.map(p => p.category))];
            const brs = ['All', ...new Set(data.map(p => p.brand))];
            setCategoriesList(cats);
            setBrandsList(brs);
          }
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedBrand, selectedShop, priceRange, searchQuery]);

  // Fetch Recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        const response = await authenticatedFetch('/products/recommendations');
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data);
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Quick Add item
  const handleQuickAdd = (product, shopId) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    
    try {
      addToCart(product, shopId, shop.name, 1);
      setCartError(prev => ({ ...prev, [product.id]: { success: true, message: 'Added to cart!' } }));
      setTimeout(() => {
        setCartError(prev => ({ ...prev, [product.id]: null }));
      }, 2000);
    } catch (err) {
      setCartError(prev => ({ ...prev, [product.id]: { success: false, message: err.message } }));
      setTimeout(() => {
        setCartError(prev => ({ ...prev, [product.id]: null }));
      }, 3000);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedShop('All');
    setPriceRange({ min: '', max: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Main Catalog Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="catalog-grid">
        
        {/* Sidebar Filter Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-none sticky top-20 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-gray-200 dark:border-gray-800">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-gray-900 dark:text-white">
                <Filter className="w-4 h-4 text-black dark:text-white" /> Filters
              </h3>
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Category
              </label>
              <div className="flex flex-col gap-1">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-1.5 rounded-none text-xs font-bold uppercase transition-all duration-150 ${
                      selectedCategory === cat
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 text-xs font-bold uppercase focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none text-gray-900 dark:text-white"
              >
                {brandsList.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Shop Assignment Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Shop Location
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 text-xs font-bold uppercase focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="All">All Shop Branches</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Price Range (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-none border border-gray-200 dark:border-gray-800">
            <h3 className="font-black text-2xl uppercase tracking-wider text-black dark:text-white">
              AUTOMOBILE PRODUCTS CATALOG
            </h3>
            {searchQuery && (
              <span className="text-[10px] px-2.5 py-1 bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 font-bold uppercase border border-gray-250 dark:border-gray-800">
                Search: "{searchQuery}"
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 h-96 rounded-none animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none space-y-4">
              <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-700" />
              <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white uppercase">No products match your criteria</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto mt-1">Try resetting your filter parameters or tweaking your search term.</p>
              </div>
              <button onClick={clearFilters} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs rounded-none border border-black dark:border-white">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(product => {
                // Determine shops with active stock
                const availableShops = Object.keys(product.stock || {}).filter(
                  shopId => product.stock[shopId] > 0
                );
                const isOutOfStock = availableShops.length === 0;

                // Simulate original price to show strike-through discount
                const originalPrice = Math.round(product.price * 1.25);

                return (
                  <div 
                    key={product.id} 
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group relative p-4 justify-between h-[450px]"
                  >
                    {/* Image */}
                    <div 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="h-44 bg-white dark:bg-gray-950 relative overflow-hidden cursor-pointer flex items-center justify-center border-b border-gray-100 dark:border-gray-800 pb-2"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-350"
                        onError={(e) => handleImageError(e, product.category, product.name)}
                      />
                      <span className="absolute top-0 left-0 px-2 py-0.5 bg-black text-[9px] font-bold text-white uppercase tracking-wider">
                        {product.category}
                      </span>
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 rounded-full border shadow-sm transition-colors z-10"
                          title={wishlist.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 transition-colors ${
                              wishlist.includes(product.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-400 hover:text-red-500'
                            }`} 
                          />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between pt-3 space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase">
                          <span>{product.brand}</span>
                          <div className="flex gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-2.5 h-2.5 ${i < Math.round(product.rating || 4) ? 'fill-amber-500 text-amber-500' : 'text-gray-200 dark:text-gray-700'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        
                        <h4 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="font-extrabold text-black dark:text-white text-xs uppercase hover:text-indigo-600 cursor-pointer line-clamp-2 leading-tight transition-colors"
                        >
                          {product.name}
                        </h4>
                        
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-snug">
                          {product.description}
                        </p>
                      </div>

                      {/* Branch stock indicators (compact) */}
                      <div className="text-[9px] text-gray-400 dark:text-gray-500 space-y-0.5 border-t border-gray-100 dark:border-gray-800 pt-1">
                        {shops.map(shop => {
                          const stockCount = product.stock?.[shop.id] ?? 0;
                          return (
                            <div key={shop.id} className="flex justify-between items-center">
                              <span className="truncate max-w-[120px]">{shop.name.split(' ')[0]} location:</span>
                              <span className={stockCount > 0 ? 'text-gray-600 dark:text-gray-300 font-bold' : 'text-red-500 font-bold'}>
                                {stockCount > 0 ? `${stockCount} units` : 'Out'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Price and Buy Button side-by-side */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                           <span className="text-sm font-black text-black dark:text-white">₹{product.price.toLocaleString('en-IN')}</span>
                           <span className="text-[10px] text-red-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                        </div>

                        <div>
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-550 font-bold text-[10px] uppercase cursor-not-allowed border border-gray-250 dark:border-gray-700 rounded-none"
                            >
                              Out
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (availableShops.length === 1) {
                                  handleQuickAdd(product, availableShops[0]);
                                } else {
                                  navigate(`/product/${product.id}`);
                                }
                              }}
                              className="px-4 py-1.5 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-black font-bold text-[10px] uppercase tracking-wider transition-all duration-200 rounded-none active:scale-[0.98]"
                            >
                              Buy
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Success / Error Toast Overlay inside card */}
                      {cartError[product.id] && (
                        <div className={`absolute inset-x-0 bottom-0 text-center py-2 text-[10px] font-bold uppercase border-t ${
                          cartError[product.id].success 
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-red-50 dark:bg-red-950 border-red-250 dark:border-red-900 text-red-800 dark:text-red-300'
                        }`}>
                          {cartError[product.id].message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-10 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          <h3 className="font-extrabold text-xl uppercase tracking-wider text-black dark:text-white">AI Recommendations</h3>
        </div>
        
        {recLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 h-64 rounded-none animate-pulse"></div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-xs text-gray-400 uppercase font-semibold">Order from categories to trigger personalized engine predictions.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {recommendations.map(product => (
              <div 
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-none hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between h-72"
              >
                <div className="h-28 bg-white dark:bg-gray-950 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 pb-2">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" onError={(e) => handleImageError(e, product.category, product.name)} />
                </div>
                <div className="space-y-1 mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{product.brand}</span>
                    <h5 className="font-extrabold text-xs text-black dark:text-white uppercase truncate leading-tight">{product.name}</h5>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 h-7 leading-snug">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="font-black text-xs text-black dark:text-white">₹{product.price.toFixed(2)}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {product.rating || '4.5'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Products;
