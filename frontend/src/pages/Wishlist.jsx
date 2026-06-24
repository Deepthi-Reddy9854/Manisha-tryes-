import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingCart, Heart, ArrowRight, Loader2, Star } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback';


const Wishlist = () => {
  const { authenticatedFetch, updateWishlist, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [successMsg, setSuccessMsg] = useState({});

  const fetchWishlistData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile to get latest wishlist IDs
      const meRes = await authenticatedFetch('/auth/me');
      if (!meRes.ok) throw new Error('Session expired.');
      const meData = await meRes.json();
      const wishlistIds = meData.wishlist || [];

      if (wishlistIds.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      // Fetch all products to filter matched ones
      const prodRes = await authenticatedFetch('/products');
      if (prodRes.ok) {
        const allProducts = await prodRes.json();
        const matched = allProducts.filter(p => wishlistIds.includes(p.id));
        setWishlistItems(matched);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWishlistData();
  }, [fetchWishlistData]);

  const handleRemoveFromWishlist = async (productId) => {
    setActionLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await authenticatedFetch(`/users/wishlist/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
        if (user) {
          const nextWishlist = (user.wishlist || []).filter(id => id !== productId);
          updateWishlist(nextWishlist);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = (product) => {
    // Determine a branch with stock to add
    const availableShops = Object.keys(product.stock || {}).filter(
      shopId => product.stock[shopId] > 0
    );

    if (availableShops.length === 0) return;

    // Pick first shop branch
    const shopId = availableShops[0];
    const shopName = shopId === 'shop-1' ? 'Downtown Moto' : shopId === 'shop-2' ? 'Highway Tyres' : 'Metro Auto Parts';

    try {
      addToCart(product, shopId, shopName, 1);
      setSuccessMsg(prev => ({ ...prev, [product.id]: 'Added to Cart!' }));
      setTimeout(() => {
        setSuccessMsg(prev => ({ ...prev, [product.id]: null }));
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-500">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title */}
      <div className="border-b pb-4 border-gray-150 dark:border-gray-800">
        <h1 className="text-3xl font-black font-display tracking-tight text-gray-900 dark:text-white flex items-center gap-2 uppercase">
          <Heart className="w-8 h-8 text-red-500 fill-red-500/20" /> My Saved Wishlist
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and quickly order your saved automotive tools, engine lubricants, and vehicle tyres.
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-none space-y-4">
          <Heart className="w-16 h-16 text-gray-250 dark:text-gray-700" />
          <div>
            <h3 className="font-extrabold text-base text-gray-800 dark:text-gray-200 uppercase">Your wishlist is empty</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Save parts and accessories here while shopping to keep track of them.</p>
          </div>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs rounded-none flex items-center gap-1">
            Browse Products <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map(item => {
            const hasStock = Object.values(item.stock || {}).some(qty => qty > 0);
            const originalPrice = Math.round(item.price * 1.25);

            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-900 border dark:border-gray-850 rounded-none overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-[420px] p-4 relative group"
              >
                {/* Image */}
                <div 
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="h-40 bg-white relative overflow-hidden cursor-pointer flex items-center justify-center border-b dark:border-gray-800 pb-2"
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-350"
                    onError={(e) => handleImageError(e, item.category, item.name)}
                  />
                  <span className="absolute top-0 left-0 px-2 py-0.5 bg-black text-[9px] font-bold text-white uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-grow flex flex-col justify-between pt-3 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase">
                      <span>{item.brand}</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{item.rating || '4.5'}</span>
                      </div>
                    </div>

                    <h4 
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="font-extrabold text-black dark:text-white text-xs uppercase hover:text-indigo-600 cursor-pointer line-clamp-2 leading-tight transition-colors"
                    >
                      {item.name}
                    </h4>
                    
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-black dark:text-white">₹{item.price.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-red-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase ${hasStock ? 'text-emerald-600' : 'text-red-500'}`}>
                      {hasStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      disabled={actionLoading[item.id]}
                      className="p-2 border border-gray-200 dark:border-gray-850 text-gray-400 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:border-red-900 rounded-none transition-colors flex items-center justify-center"
                      title="Remove from Saved"
                    >
                      {actionLoading[item.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!hasStock}
                      className="flex-1 py-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-white dark:text-black font-extrabold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-none disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Buy / Add to Cart
                    </button>
                  </div>
                </div>

                {/* Toast overlay inside card */}
                {successMsg[item.id] && (
                  <div className="absolute inset-x-0 bottom-0 text-center py-2 text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-900">
                    {successMsg[item.id]}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
