import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import {
  FileDown,
  Search,
  MessageSquare,
  Phone,
  Package,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Truck,
  Clock,
  CheckCircle2,
  Warehouse,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import { handleImageError, handleUserAvatarError } from '../utils/imageFallback';


const Orders = () => {
  const { user, authenticatedFetch } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Review & Ratings States
  // eslint-disable-next-line no-unused-vars
  const [reviewFormOpen, setReviewFormOpen] = useState({}); // 'orderId-productId' -> bool
  // eslint-disable-next-line no-unused-vars
  const [productRatings, setProductRatings] = useState({}); // 'orderId-productId' -> rating
  // eslint-disable-next-line no-unused-vars
  const [productComments, setProductComments] = useState({}); // 'orderId-productId' -> comment
  // eslint-disable-next-line no-unused-vars
  const [reviewSubmitted, setReviewSubmitted] = useState({}); // 'orderId-productId' -> bool

  // Dashboard navigation and UI states
  const [currentView, setCurrentView] = useState('tracking'); // 'overview' | 'tracking'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Accepted' | 'Shipped' | 'Delivered'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(true);
  const { isDark: dashboardDark, toggleTheme } = useTheme();

  // Fetch orders from the backend
  const fetchOrders = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        if (data.length > 0 && !expandedOrderId) {
          setExpandedOrderId(data[0].id);
        }
      } else {
        throw new Error('Could not retrieve orders log.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load orders history.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, expandedOrderId]);

  // eslint-disable-next-line no-unused-vars
  const handleReorder = (order) => {
    order.items.forEach(item => {
      const productObj = {
        id: item.productId,
        name: item.name,
        price: item.price,
        stock: {} // mock stock object
      };
      addToCart(productObj, item.shopId, item.shopName, item.quantity);
    });
    alert('Items from this order have been successfully added to your checkout cart!');
    navigate('/cart');
  };

  // eslint-disable-next-line no-unused-vars
  const handleReviewSubmit = async (orderId, productId) => {
    const key = `${orderId}-${productId}`;
    const rating = productRatings[key] || 5;
    const comment = productComments[key] || '';

    try {
      const response = await authenticatedFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      if (response.ok) {
        setReviewSubmitted(prev => ({ ...prev, [key]: true }));
        // Silently reload products list if needed
        setTimeout(() => {
          setReviewFormOpen(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to feedback telemetry.');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // PDF Invoice Generator
  const generateInvoicePDF = (order) => {
    setPdfGenerating(prev => ({ ...prev, [order.id]: true }));
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = '#4f46e5'; // Indigo accent
      const darkColor = '#1a202c'; // Charcoal

      // Header Banner
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor('#ffffff');
      doc.text('AUTO NEXUS CO.', 20, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Automobile Lubricants, Tyres, & Spare Parts Supplier', 20, 28);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INVOICE', 150, 20);

      // Metadata Details
      doc.setTextColor(darkColor);
      doc.setFontSize(10);

      doc.text('Invoice Details:', 20, 52);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Order ID:      ${order.id}`, 20, 58);
      doc.text(`Date Placed:   ${new Date(order.createdAt).toLocaleDateString()}`, 20, 64);
      doc.text(`Order Status:  ${order.status}`, 20, 70);

      // Customer Details
      doc.setFont('Helvetica', 'bold');
      doc.text('Bill To Customer:', 110, 52);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name:    ${order.deliveryDetails?.name || order.userName}`, 110, 58);
      doc.text(`Phone:   ${order.deliveryDetails?.phone || 'N/A'}`, 110, 64);
      doc.text(`Address: ${order.deliveryDetails?.address || 'N/A'}`, 110, 70);
      if (order.gstNumber) {
        doc.setFont('Helvetica', 'bold');
        doc.text(`GSTIN:   ${order.gstNumber}`, 110, 75);
      }

      // Separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 78, 190, 78);

      // Table Headers
      doc.setFillColor(247, 250, 252);
      doc.rect(20, 85, 170, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('Product Name', 22, 90);
      doc.text('Shop Branch', 95, 90);
      doc.text('Qty', 145, 90);
      doc.text('Price', 160, 90);
      doc.text('Subtotal', 175, 90);

      // Table Items
      doc.setFont('Helvetica', 'normal');
      let yOffset = 98;

      order.items.forEach((item) => {
        const nameLines = doc.splitTextToSize(item.name, 70);
        const nameHeight = nameLines.length * 4;

        doc.text(nameLines, 22, yOffset);
        doc.text(item.shopName.split(' ')[0], 95, yOffset);
        doc.text(item.quantity.toString(), 145, yOffset);
        doc.text(`Rs ${item.price.toFixed(2)}`, 160, yOffset);
        doc.text(`Rs ${(item.price * item.quantity).toFixed(2)}`, 175, yOffset);

        yOffset += Math.max(nameHeight, 8);
      });

      // Divider line
      doc.line(20, yOffset + 2, 190, yOffset + 2);

      // Costs Summary
      yOffset += 10;
      doc.setFont('Helvetica', 'bold');
      doc.text('Grand Total:', 140, yOffset);
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text(`Rs ${order.totalPrice.toFixed(2)}`, 170, yOffset);

      // Footer notice
      yOffset += 20;
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#a0aec0');
      doc.text('This is an electronically generated invoice from Auto Nexus Portal.', 20, yOffset);
      doc.text('Terms: All products collected or shipped are eligible for distributor warranty coverage.', 20, yOffset + 5);

      // Download trigger
      doc.save(`AutoNexus_Invoice_${order.id}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Error generating PDF invoice. Please try again.');
    } finally {
      setPdfGenerating(prev => ({ ...prev, [order.id]: false }));
    }
  };

  // Helper mapping order status to badges
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'Delivered':
        return { text: 'Delivered', color: 'bg-red-50 text-red-600 border-red-100' };
      case 'Shipped':
        return { text: 'In Transit', color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'Accepted':
        return { text: 'In Transit', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      default:
        return { text: 'Pending Pickup', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // Stepper timeline dynamic timestamp calculator
  const formatStepTime = (baseDate, hoursToAdd) => {
    const date = new Date(baseDate);
    date.setHours(date.getHours() + hoursToAdd);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter orders by search query & status filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = `SHP${order.id.slice(-6).toUpperCase()}`.includes(searchQuery.toUpperCase()) || order.id.includes(searchQuery);

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Pending') return matchesSearch && order.status === 'Pending';
    if (statusFilter === 'Accepted') return matchesSearch && order.status === 'Accepted';
    if (statusFilter === 'Shipped') return matchesSearch && order.status === 'Shipped';
    if (statusFilter === 'Delivered') return matchesSearch && order.status === 'Delivered';
    return matchesSearch;
  });

  const activeOrder = filteredOrders.find(o => o.id === expandedOrderId) || filteredOrders[0] || orders[0];



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing Logistics...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300 ${dashboardDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>

      {/* MOBILE HEADER BAR */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b ${dashboardDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-150'
        }`}>
        {/* Zhippes Branding */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
            Z
          </div>
          <span className={`font-extrabold text-sm tracking-tight ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>Zhippes</span>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-1.5 rounded-lg border text-xs font-bold ${dashboardDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          Menu
        </button>
      </div>

      {/* DASHBOARD SIDEBAR PANEL (Left) */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:flex flex-col justify-between w-full md:w-64 border-r shrink-0 transition-colors duration-350 p-6 ${dashboardDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100 select-none">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16L4 20h16" />
              </svg>
            </div>
            <span className={`font-extrabold text-base tracking-tight font-display transition-colors ${dashboardDark ? 'text-white' : 'text-gray-950'
              }`}>Zhippes</span>
          </div>

          {/* Sidebar Menu Group */}
          <div className="space-y-5 pt-3">

            {/* Dashboard category */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase block mb-1">DASHBOARD</span>

              <button
                onClick={() => { setCurrentView('overview'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left ${currentView === 'overview'
                    ? (dashboardDark ? 'text-white bg-slate-900' : 'text-gray-900 bg-slate-50')
                    : 'hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Overview</span>
              </button>

              <div className="space-y-0.5">
                <button
                  onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg text-left ${currentView === 'tracking'
                      ? (dashboardDark ? 'text-white' : 'text-gray-900')
                      : 'hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span>Order Management</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOrderDropdownOpen && (
                  <div className="pl-9 space-y-1 py-1 text-[11px] font-bold">
                    {[
                      { filter: 'All', label: 'All Shipments' },
                      { filter: 'Pending', label: 'New Shipments' },
                      { filter: 'Accepted', label: 'In Progress' },
                      { filter: 'Shipped', label: 'Dispatched' },
                      { filter: 'Delivered', label: 'Delivered' }
                    ].map(tab => (
                      <button
                        key={tab.filter}
                        onClick={() => {
                          setStatusFilter(tab.filter);
                          setCurrentView('tracking');
                          setIsSidebarOpen(false);
                        }}
                        className={`block py-1 w-full text-left transition-colors ${statusFilter === tab.filter && currentView === 'tracking'
                            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                            : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-200'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>



          </div>
        </div>


      </div>

      {/* CORE CONTENT REGION (Right) */}
      <div className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto">

        {/* Top Header Greetings */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className={`text-2xl font-black font-display tracking-tight ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>
              Good Morning, {user?.name.split(' ')[0] || 'Ralph'} 👋
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase mt-0.5 tracking-wider">
              {currentView === 'tracking' && `Shipment Monitor • Filter: ${statusFilter}`}
              {currentView === 'overview' && 'Logistics Operational Statistics'}
            </p>
          </div>

          {/* Shipment search query (only active in shipment tracker) */}
          {currentView === 'tracking' && (
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Shipment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 transition-all ${dashboardDark
                    ? 'border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:ring-indigo-500'
                    : 'border-gray-250 bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500'
                  }`}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold border border-red-100 rounded-xl">
            {error}
          </div>
        )}

        {/* DYNAMIC VIEWS SWAPPER */}

        {/* VIEW 1: SHIPMENT LOGS TRACKING (MOCKUP TIMELINE SCREEN) */}
        {currentView === 'tracking' && (
          <>
            {filteredOrders.length === 0 ? (
              <div className={`text-center py-16 border rounded-2xl ${dashboardDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-150'
                }`}>
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className={`font-bold text-sm uppercase ${dashboardDark ? 'text-slate-300' : 'text-gray-700'}`}>No Shipments Found</h3>
                <p className="text-xs text-gray-400 mt-1">No orders matched the active filter or query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Center Column: Collapsible / Expanding shipment list */}
                <div className="lg:col-span-2 space-y-4">
                  {filteredOrders.map(order => {
                    const isExpanded = order.id === expandedOrderId;
                    const statusInfo = getOrderStatusInfo(order.status);
                    const shipmentId = `SHP${order.id.slice(-6).toUpperCase()}`;

                    return (
                      <div
                        key={order.id}
                        className={`border rounded-2xl transition-all shadow-xs ${isExpanded
                            ? (dashboardDark ? 'bg-slate-900 border-indigo-600/45' : 'bg-white border-indigo-600/30 ring-1 ring-indigo-600/10')
                            : (dashboardDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80' : 'bg-white border-gray-150 hover:bg-gray-50/40')
                          }`}
                      >
                        {/* Collapsed Header click panel */}
                        <div
                          onClick={() => toggleExpand(order.id)}
                          className="p-5 flex justify-between items-center cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dashboardDark ? 'bg-slate-800' : 'bg-indigo-50/50'
                              }`}>
                              <Package className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <h4 className={`font-extrabold text-sm ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>{shipmentId}</h4>
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block mt-0.5">
                                Created: {new Date(order.createdAt).toLocaleDateString()} • Value: ₹{order.totalPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded state timeline & details */}
                        {isExpanded && (
                          <div className="px-5 pb-6 border-t border-gray-100 dark:border-slate-800/60 pt-5 space-y-6 animate-in fade-in duration-200">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                              {/* 1. Progress timeline stepper */}
                              <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipment Stepper Progress</p>

                                <div className="relative pl-6 space-y-6">
                                  {/* vertical dashed line */}
                                  <div className="absolute left-2 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-gray-250 dark:border-slate-850"></div>

                                  {/* Step 1: Pending */}
                                  <div className="relative flex items-start gap-4 text-xs">
                                    <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 shadow-xs ${['Pending', 'Accepted', 'Shipped', 'Delivered'].includes(order.status)
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-gray-300'
                                      }`}>
                                      <Clock className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold ${dashboardDark ? 'text-white' : 'text-gray-900'}`}>Pending Pickup</h5>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Shipment scheduled for pickup</p>
                                    </div>
                                    <span className="ml-auto text-[10px] text-gray-400 font-bold font-mono">{formatStepTime(order.createdAt, 0)}</span>
                                  </div>

                                  {/* Step 2: Sorting Facility */}
                                  <div className="relative flex items-start gap-4 text-xs">
                                    <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 shadow-xs ${['Accepted', 'Shipped', 'Delivered'].includes(order.status)
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-gray-300'
                                      }`}>
                                      <Warehouse className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold ${['Accepted', 'Shipped', 'Delivered'].includes(order.status)
                                          ? (dashboardDark ? 'text-white' : 'text-gray-900')
                                          : 'text-gray-400'
                                        }`}>At Sorting Facility</h5>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Shipment Jakarta sorting center</p>
                                    </div>
                                    <span className="ml-auto text-[10px] text-gray-400 font-bold font-mono">{formatStepTime(order.createdAt, 2)}</span>
                                  </div>

                                  {/* Step 3: Out for Delivery (Highlighted red/pink in screenshot if Shipped) */}
                                  <div className="relative flex items-start gap-4 text-xs">
                                    <div className={`absolute -left-[27px] -top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-4 shadow-sm transition-all ${order.status === 'Shipped'
                                        ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-950 animate-pulse'
                                        : (['Delivered'].includes(order.status)
                                          ? 'bg-indigo-600 border-indigo-600 text-white'
                                          : 'bg-white border-gray-300')
                                      }`}>
                                      {order.status === 'Shipped' ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                      ) : (
                                        <Truck className="w-2.5 h-2.5 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold ${['Shipped', 'Delivered'].includes(order.status)
                                          ? (order.status === 'Shipped' ? 'text-indigo-600' : (dashboardDark ? 'text-white' : 'text-gray-900'))
                                          : 'text-gray-400'
                                        }`}>Out for Delivery</h5>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Shipment delivery from Bandung</p>
                                    </div>
                                    <span className="ml-auto text-[10px] text-gray-400 font-bold font-mono">{formatStepTime(order.createdAt, 5)}</span>
                                  </div>

                                  {/* Step 4: Delivered */}
                                  <div className="relative flex items-start gap-4 text-xs">
                                    <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 shadow-xs ${order.status === 'Delivered'
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-gray-300'
                                      }`}>
                                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold ${order.status === 'Delivered'
                                          ? (dashboardDark ? 'text-white' : 'text-gray-900')
                                          : 'text-gray-400'
                                        }`}>Delivered</h5>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Shipment delivered to the recipient</p>
                                    </div>
                                    <span className="ml-auto text-[10px] text-gray-400 font-bold font-mono">{formatStepTime(order.createdAt, 7)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Driver courier assignment block */}
                              <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver Assignment</p>

                                <div className={`p-4 border rounded-xl flex items-center justify-between shadow-3xs ${dashboardDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-150'
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200">
                                      <img
                                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                                        alt="Kevin Driver"
                                        className="w-full h-full object-cover"
                                        onError={handleUserAvatarError}
                                      />
                                    </div>
                                    <div>
                                      <h5 className={`font-bold text-xs ${dashboardDark ? 'text-white' : 'text-gray-900'}`}>Kevin Hartanto</h5>
                                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wide block mt-0.5">Driver Courier</span>
                                    </div>
                                  </div>

                                  {/* Call & Chat Action buttons */}
                                  <div className="flex gap-2">
                                    <button className="p-2 bg-indigo-50 hover:bg-[#EEF2FF] text-indigo-650 transition-colors rounded-full focus:outline-none">
                                      <Phone className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-2 bg-indigo-50 hover:bg-[#EEF2FF] text-indigo-650 transition-colors rounded-full focus:outline-none">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* PDF invoice downloader */}
                                <div className="pt-2">
                                  <button
                                    onClick={() => generateInvoicePDF(order)}
                                    disabled={pdfGenerating[order.id]}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl border border-transparent shadow-xs active:scale-[0.99] transition-all focus:outline-none"
                                  >
                                    {pdfGenerating[order.id] ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Compiling...</span>
                                      </>
                                    ) : (
                                      <>
                                        <FileDown className="w-4 h-4" /> Download PDF Invoice
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                            </div>

                            {/* 3. Items summaries */}
                            <div className="border-t border-gray-100 dark:border-slate-800/60 pt-5 space-y-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordered Products</p>
                              <div className={`p-4 border rounded-xl space-y-2.5 ${dashboardDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-150'
                                }`}>
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0 border-gray-100 dark:border-slate-800/60 text-xs font-bold text-gray-600 dark:text-slate-350">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                                        <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" onError={(e) => handleImageError(e, item.category, item.name)} />
                                      </div>
                                      <div>
                                        <span className="block font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{item.name}</span>
                                        <span className="block text-[10px] text-gray-400 font-normal">({item.shopName?.split(' ')[0] || 'Wholesale'} branch)</span>
                                      </div>
                                    </div>
                                    <span className="shrink-0 text-gray-900 dark:text-white font-mono">{item.quantity} x ₹{item.price.toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Side Column: Active Shipment Overview summary card */}
                <div className="space-y-6">
                  {activeOrder && (
                    <div className={`border p-6 rounded-2xl shadow-xs space-y-5 ${dashboardDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'
                      }`}>
                      <h4 className={`font-black text-xs uppercase tracking-wider pb-3 border-b ${dashboardDark ? 'border-slate-800 text-slate-350' : 'border-gray-100 text-gray-500'
                        }`}>Detailed Shipment</h4>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shadow-inner">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                            alt="Kevin Active"
                            className="w-full h-full object-cover"
                            onError={handleUserAvatarError}
                          />
                        </div>
                        <div>
                          <h5 className={`font-bold text-xs ${dashboardDark ? 'text-white' : 'text-gray-900'}`}>Kevin Hartanto</h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${activeOrder.status === 'Delivered' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                              }`}></span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              {activeOrder.status === 'Delivered' ? 'Delivered' : 'En Route'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-gray-100 dark:border-slate-800/60 pt-4">
                        <div>
                          <span className="text-gray-400 font-bold block uppercase tracking-wider mb-0.5">Status</span>
                          <span className={`font-extrabold uppercase ${activeOrder.status === 'Delivered' ? 'text-red-500' : 'text-indigo-500'
                            }`}>
                            {activeOrder.status === 'Shipped' ? 'Out for Delivery' : activeOrder.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase tracking-wider mb-0.5">Current Location</span>
                          <span className={`font-extrabold uppercase ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>
                            {activeOrder.status === 'Delivered' ? 'Delivered Store' : (
                              activeOrder.status === 'Shipped' ? 'Bandung Hub' : 'Sorting facility'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={`p-4.5 rounded-xl border flex items-center gap-3 text-xs leading-relaxed ${dashboardDark ? 'bg-slate-900/60 border-slate-850' : 'bg-slate-50 border-gray-150'
                        }`}>
                        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wide">
                          Verified distributor dispatch log code: <span className={`font-mono block mt-0.5 font-extrabold ${dashboardDark ? 'text-white' : 'text-gray-900'
                            }`}>{activeOrder.id.toUpperCase()}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary Helper Card */}
                  <div className={`border p-6 rounded-2xl shadow-inner text-xs ${dashboardDark ? 'bg-slate-900/40 border-slate-850 text-slate-400' : 'bg-[#eef2f6]/50 border-gray-150 text-gray-650'
                    }`}>
                    <h5 className="font-bold mb-1 text-gray-900 dark:text-white uppercase tracking-wider">Logistics Radar Info</h5>
                    <p className="leading-relaxed text-[11px]">
                      This view is designed for order management and tracking logs. Use the sidebar dropdown under Order Management to filter orders by dispatch timelines.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* VIEW 2: LOGISTICS OVERVIEW (STATS & VECTOR CHARTS) */}
        {currentView === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Shipments', val: orders.length, change: 'Sync: Live', color: 'border-l-4 border-indigo-500' },
                { label: 'Active Fleet Drivers', val: '3 Couriers', change: '1 Standby', color: 'border-l-4 border-emerald-500' },
                { label: 'In-Transit Value', val: `₹${orders.filter(o => o.status !== 'Delivered').reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString('en-IN')}`, change: 'Est. Dispatch', color: 'border-l-4 border-indigo-400' },
                { label: 'Completed Deliveries', val: orders.filter(o => o.status === 'Delivered').length, change: '100% SLA', color: 'border-l-4 border-red-500' }
              ].map((stat, i) => (
                <div key={i} className={`p-5 border rounded-2xl shadow-2xs ${dashboardDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'
                  } ${stat.color}`}>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                  <h3 className={`text-xl font-black mt-1.5 ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>{stat.val}</h3>
                  <span className="text-[9px] font-bold text-gray-450 block mt-1 uppercase tracking-wide">{stat.change}</span>
                </div>
              ))}
            </div>

            {/* SVG Curving Chart representation */}
            <div className={`border p-6 rounded-2xl shadow-xs space-y-4 ${dashboardDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'
              }`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-black text-sm uppercase tracking-wider ${dashboardDark ? 'text-white' : 'text-gray-950'}`}>
                  Operational Dispatch Volume
                </h3>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  7-Day Trend
                </span>
              </div>

              {/* Responsive SVG Line Chart */}
              <div className="w-full overflow-hidden">
                <svg viewBox="0 0 500 200" className="w-full h-48 text-[#4FD1C5]">
                  <line x1="50" y1="20" x2="450" y2="20" stroke={dashboardDark ? '#334155' : '#f1f5f9'} strokeWidth="1" />
                  <line x1="50" y1="70" x2="450" y2="70" stroke={dashboardDark ? '#334155' : '#f1f5f9'} strokeWidth="1" />
                  <line x1="50" y1="120" x2="450" y2="120" stroke={dashboardDark ? '#334155' : '#f1f5f9'} strokeWidth="1" />
                  <line x1="50" y1="170" x2="450" y2="170" stroke={dashboardDark ? '#475569' : '#e2e8f0'} strokeWidth="1.5" />

                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4FD1C5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 50,170 C 100,120 150,160 200,90 C 250,50 300,110 350,60 C 400,30 420,50 450,40 L 450,170 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M 50,170 C 100,120 150,160 200,90 C 250,50 300,110 350,60 C 400,30 420,50 450,40"
                    fill="none"
                    stroke="#4FD1C5"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <circle cx="200" cy="90" r="5" fill="#4FD1C5" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="350" cy="60" r="5" fill="#4FD1C5" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="450" cy="40" r="6" fill="#319795" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Recent activity timeline logs */}
            <div className={`border p-6 rounded-2xl shadow-xs ${dashboardDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'
              }`}>
              <h3 className={`font-black text-sm uppercase tracking-wider pb-3 border-b ${dashboardDark ? 'border-slate-800 text-white' : 'border-gray-100 text-gray-950'
                }`}>Recent Activity Logs</h3>
              <div className="space-y-4 pt-4 text-xs font-semibold text-gray-400">
                {[
                  { desc: 'Cargo manifest generated for shipment Kevin Hartanto', time: '10 mins ago', type: 'System' },
                  { desc: 'Order collection dispatched to Karawang Warehouse facility', time: '40 mins ago', type: 'Carrier' },
                  { desc: 'Seeded stock inventory sync successfully synchronized', time: '2 hours ago', type: 'Database' },
                  { desc: 'New distributor purchase registered at shop branch 1', time: '3 hours ago', type: 'Storefront' }
                ].map((act, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 py-1.5 border-b border-gray-50 dark:border-slate-850 last:border-0">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <div>
                        <p className={dashboardDark ? 'text-slate-350' : 'text-gray-700'}>{act.desc}</p>
                        <span className="text-[9px] font-extrabold text-[#6366F1] uppercase mt-0.5 block">{act.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
