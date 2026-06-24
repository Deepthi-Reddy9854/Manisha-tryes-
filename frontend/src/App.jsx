import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

// Page Imports
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';

// Layout shell showing navbar on app routes
const AppLayout = ({ searchQuery, setSearchQuery }) => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/admin';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-150 transition-colors duration-300 bg-grid-pattern">
      {showNavbar && <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      <main className="flex-grow pb-12">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Unauthenticated Endpoint */}
              <Route path="/login" element={<Login />} />

              {/* Protected Endpoints */}
              <Route element={<ProtectedRoute adminOnly={false} />}>
                <Route element={<AppLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}>
                  {/* Customer Storefront Page */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  
                  {/* Products Catalog */}
                  <Route path="/products" element={<Products searchQuery={searchQuery} />} />
                  
                  {/* Specs Details */}
                  <Route path="/product/:id" element={<ProductDetail />} />
                  
                  {/* Cart review */}
                  <Route path="/cart" element={<Cart />} />
                  
                  {/* Orders logs */}
                  <Route path="/orders" element={<Orders />} />
                  
                  {/* Profile */}
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* Wishlist */}
                  <Route path="/wishlist" element={<Wishlist />} />

                  {/* Feedback */}
                  <Route path="/feedback" element={<Feedback />} />
                </Route>
              </Route>

              {/* Admin Protection Gate */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route element={<AppLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}>
                  {/* Control Panel */}
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Routing Fallbacks */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
