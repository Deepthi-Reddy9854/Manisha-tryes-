import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, 
  User, 
  LogOut, 
  Search, 
  Menu, 
  X, 
  Heart, 
  Truck, 
  Store
} from 'lucide-react';

const Navbar = ({ setSearchQuery, searchQuery }) => {
  const { user, logout, isAdmin, isDelivery, isManager } = useAuth();
  const { totalItems } = useCart();
  // Removed unused theme hook
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute active navigation link dynamically during render to avoid useEffect state sync loops
  const getActiveNavName = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');

    if (path === '/' || path === '/home') {
      if (section === 'about') return 'ABOUT';
      if (section === 'contact') return 'CONTACT';
      return 'HOME';
    }
    if (path === '/products') return 'COLLECTION';
    if (path === '/wishlist') return 'WISHLIST';
    if (path === '/feedback') return 'FEEDBACK';
    if (path === '/admin') return 'ADMIN PORTAL';
    if (path === '/delivery') return 'DRIVER HOME';
    if (path === '/manager') return 'MANAGER PORTAL';
    return '';
  };

  const activeNavName = getActiveNavName();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileOpen && !event.target.closest('.profile-dropdown-container')) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [profileOpen]);

  const getLinkClass = (name) => {
    const isActive = activeNavName === name;
    return `px-3.5 py-1.5 rounded-full transition-all text-[11px] font-extrabold tracking-wide flex items-center gap-1.5 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
    }`;
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (setSearchQuery) {
      setSearchQuery(value);
    }
    if (location.pathname !== '/products') {
      navigate('/products');
    }
  };

  const handleLogoutClick = () => {
    logout();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleNavLinkClick = (e, targetId) => {
    e.preventDefault();
    if (targetId === 'about-section') {
      navigate('/?section=about');
    } else if (targetId === 'contact-footer') {
      navigate('/?section=contact');
    } else {
      navigate('/');
    }
    setMobileMenuOpen(false);
  };

  const getInitials = (name) => {
    if (typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'U';
  };

  return (
    <div className="w-full sticky top-0 z-50 flex flex-col font-sans transition-colors duration-300 bg-transparent">
      {/* Tier 1: Slim Static Top Utility Ribbon */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-650 to-indigo-900 text-white text-[10px] font-black uppercase text-center tracking-widest py-2 select-none border-b border-indigo-950 shadow-sm">
        FREE SHIPPING ON ORDERS OVER ₹4,999 🌟
      </div>

      {/* Floating Capsule Container */}
      <div className="w-[95%] max-w-7xl mx-auto mt-2.5 mb-2 relative">
        {/* Floating Capsule Bar */}
        <div className="w-full bg-indigo-50/75 dark:bg-brand-950/75 backdrop-blur-xl border border-indigo-100/80 dark:border-indigo-500/20 rounded-full transition-all duration-300 shadow-md dark:shadow-[0_8px_30px_rgba(124,58,237,0.12)] px-6 py-2.5 flex justify-between items-center h-12">
          
          {/* Logo / Brand */}
          <Link to="/" onClick={(e) => handleNavLinkClick(e, 'top')} className="flex items-center group flex-shrink-0">
            <h1 className="text-xl font-black italic tracking-tighter text-black dark:text-white font-display uppercase leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-end">
              Auto Nexus<span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-0.5 mb-1 animate-pulse-subtle"></span>
            </h1>
          </Link>

          {/* Desktop Centered Capsule Navigation Menu */}
          <div className="hidden md:flex items-center space-x-1 uppercase text-gray-700 dark:text-gray-300">
            {isDelivery ? (
              <>
                <Link to="/delivery" className={getLinkClass('DRIVER HOME')}>
                  DRIVER HOME
                </Link>
                <span className="px-3.5 py-1.5 rounded-full bg-indigo-50/30 dark:bg-brand-950/30 border border-indigo-100/50 dark:border-indigo-500/10 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  VEHICLE: {user?.vehicle}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-indigo-50/50 dark:bg-brand-950/50 border border-indigo-100/80 dark:border-indigo-500/20 text-[10px] text-indigo-650 dark:text-indigo-400 font-mono font-black">
                  EARNINGS: ₹{user?.earnings}
                </span>
              </>
            ) : isManager ? (
              <>
                <Link to="/manager" className={getLinkClass('MANAGER PORTAL')}>
                  MANAGER PORTAL
                </Link>
                <span className="px-3.5 py-1.5 rounded-full bg-indigo-50/30 dark:bg-brand-950/30 border border-indigo-100/50 dark:border-indigo-500/10 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  BRANCH ID: {user?.shopId}
                </span>
              </>
            ) : (
              <>
                <Link to="/" onClick={(e) => handleNavLinkClick(e, 'top')} className={getLinkClass('HOME')}>
                  HOME
                </Link>
                <a href="#" onClick={(e) => handleNavLinkClick(e, 'about-section')} className={getLinkClass('ABOUT')}>
                  ABOUT
                </a>
                <Link to="/products" className={getLinkClass('COLLECTION')}>
                  COLLECTION
                </Link>
                <a href="#" onClick={(e) => handleNavLinkClick(e, 'contact-footer')} className={getLinkClass('CONTACT')}>
                  CONTACT
                </a>
                <Link to="/feedback" className={getLinkClass('FEEDBACK')}>
                  FEEDBACK
                </Link>
              </>
            )}
          </div>

          {/* Right Action Icons & Profile Avatar Dropdown */}
          <div className="flex items-center space-x-2.5">
            {/* Search bar */}
            {user && !isDelivery && !isManager && (
              <div className="relative w-28 sm:w-44 lg:w-52 transition-all duration-300">
                <input
                  type="text"
                  placeholder="SEARCH PARTS..."
                  value={searchQuery || ''}
                  onChange={handleSearchChange}
                  className="block w-full pr-9 pl-3.5 py-1.5 border border-indigo-100/80 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-brand-950/30 text-[10px] placeholder-gray-450 dark:placeholder-gray-500 font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white rounded-full transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            )}



            {/* Wishlist & Cart buttons */}
            {user && !isDelivery && !isManager && (
              <div className="flex items-center space-x-2">
                <Link
                  to="/wishlist"
                  className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-red-500 transition-all border border-indigo-100/80 dark:border-indigo-500/20 rounded-full bg-indigo-50/30 dark:bg-brand-950/30 flex items-center justify-center hover:scale-105 active:scale-95 hover:border-indigo-500/30"
                  title="My Wishlist"
                >
                  <Heart className={`w-4 h-4 ${user.wishlist?.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                  {user.wishlist?.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black leading-none text-white bg-red-500 rounded-full">
                      {user.wishlist.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all border border-indigo-100/80 dark:border-indigo-500/20 rounded-full bg-indigo-50/30 dark:bg-brand-950/30 flex items-center justify-center hover:scale-105 active:scale-95 hover:border-indigo-500/30"
                  title="My Cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black leading-none text-white bg-indigo-600 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Profile Avatar Trigger */}
            {user && (
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/20 border border-indigo-100/80 dark:border-indigo-500/20 focus:outline-none"
                  title="Profile Options"
                >
                  {getInitials(user.name)}
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-indigo-50/95 dark:bg-brand-950/95 border border-indigo-100/80 dark:border-indigo-500/20 shadow-2xl py-2.5 z-55 text-gray-800 dark:text-gray-200 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-indigo-100/35 dark:border-indigo-500/15">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wide">Signed in as</p>
                      <p className="text-xs font-black text-gray-950 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      {user.loyaltyPoints !== undefined && (
                        <p className="text-[9px] text-indigo-655 dark:text-indigo-400 font-black mt-1 uppercase tracking-wide">
                          Points: {user.loyaltyPoints} 🌟
                        </p>
                      )}
                    </div>

                    {isDelivery && (
                      <Link
                        to="/delivery"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Driver Portal</span>
                      </Link>
                    )}
                    {isManager && (
                      <Link
                        to="/manager"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Manager Portal</span>
                      </Link>
                    )}

                    {!isAdmin && !isDelivery && !isManager && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>My Addresses & Profile</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          <span>My Wishlist</span>
                        </Link>

                      </>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-indigo-100/35 dark:border-indigo-500/15 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] tracking-wide shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                SIGN IN
              </Link>
            )}

            {/* Mobile Drawer Trigger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-800 dark:text-white md:hidden focus:outline-none flex items-center justify-center border border-indigo-100/80 dark:border-indigo-500/20 rounded-full bg-indigo-50/30 dark:bg-brand-950/30 hover:text-indigo-650 dark:hover:text-indigo-455 transition-all hover:scale-105 active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Drawer (Floating Card) */}
        {mobileMenuOpen && user && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 w-full z-45 border border-indigo-100/85 dark:border-indigo-500/25 bg-indigo-50/95 dark:bg-brand-950/95 backdrop-blur-xl px-5 py-4 rounded-3xl shadow-xl text-gray-800 dark:text-gray-200 animate-in slide-in-from-top duration-300">
            <div className="space-y-2.5 text-xs font-extrabold tracking-wider uppercase">
              {isDelivery ? (
                <>
                  <Link to="/delivery" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 text-indigo-600">
                    DRIVER HOME
                  </Link>
                  <div className="text-[10px] text-gray-400 font-mono py-1">VEHICLE: {user?.vehicle}</div>
                  <div className="text-[10px] text-indigo-500 font-mono py-1">EARNINGS: ₹{user?.earnings}</div>
                </>
              ) : isManager ? (
                <>
                  <Link to="/manager" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 text-indigo-600">
                    MANAGER DASHBOARD
                  </Link>
                  <div className="text-[10px] text-gray-400 font-mono py-1">BRANCH ID: {user?.shopId}</div>
                </>
              ) : (
                <>
                  <Link to="/" onClick={(e) => handleNavLinkClick(e, 'top')} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 text-indigo-600">
                    HOME
                  </Link>
                  <a href="#" onClick={(e) => handleNavLinkClick(e, 'about-section')} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 hover:text-indigo-600">
                    ABOUT
                  </a>
                  <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 hover:text-indigo-600">
                    COLLECTION
                  </Link>
                  <a href="#" onClick={(e) => handleNavLinkClick(e, 'contact-footer')} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 hover:text-indigo-600">
                    CONTACT
                  </a>
                  <Link to="/feedback" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 hover:text-indigo-600">
                    FEEDBACK
                  </Link>
                  {!isAdmin && !isDelivery && !isManager && (
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 border-b border-indigo-100/30 dark:border-indigo-500/10 hover:text-indigo-600">
                      MY PROFILE
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
