import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Search, Truck, Compass, ShieldCheck, AlertCircle } from 'lucide-react';

const LocationTracking = () => {
  const { authenticatedFetch } = useAuth();
  const [shipmentId, setShipmentId] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Shop branches coordinates for mock mapping
  const shops = [
    { id: 'shop-1', name: 'Downtown Moto & Lubricants', address: '452 Broad Street, Downtown', cx: 20, cy: 30, color: '#ff6b35' },
    { id: 'shop-2', name: 'Highway Tyres & Wheels', address: '88 Express Bypass, Sector 4', cx: 80, cy: 25, color: '#e0a96d' },
    { id: 'shop-3', name: 'Metro Auto Spare Parts Hub', address: '102 Industrial Area, Gate 2', cx: 40, cy: 75, color: '#4FD1C5' }
  ];

  const [selectedShop, setSelectedShop] = useState(shops[0]);

  // Track order handler
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!shipmentId) return;
    setLoading(true);
    setError('');
    setTrackingInfo(null);

    // Extract numerical ID from codes like SHP001834 or raw numbers
    const cleanId = shipmentId.toUpperCase().replace('SHP', '').trim();

    try {
      // Fetch details of this order from backend
      const response = await authenticatedFetch(`/orders`);
      if (response.ok) {
        const data = await response.json();
        // Match order by ID ending or full ID
        const matched = data.find(o => o.id.toUpperCase().endsWith(cleanId) || o.id === cleanId);
        
        if (matched) {
          // Construct realistic tracking locations
          let cx = 50;
          let cy = 50;
          let activeBranch = 'Downtown Store';
          
          if (matched.items?.length > 0) {
            const shopName = matched.items[0].shopName;
            if (shopName.includes('Highway')) {
              cx = 80; cy = 25; activeBranch = 'Highway Tyres Branch';
            } else if (shopName.includes('Metro')) {
              cx = 40; cy = 75; activeBranch = 'Metro Parts Hub';
            } else {
              cx = 20; cy = 30; activeBranch = 'Downtown Moto Branch';
            }
          }

          // Offset based on status
          let markerX = cx;
          let markerY = cy;
          let textLocation = 'Origin Branch';

          if (matched.status === 'Accepted') {
            markerX = cx + 10;
            markerY = cy + 5;
            textLocation = 'Sorting facility';
          } else if (matched.status === 'Shipped') {
            markerX = cx + 25;
            markerY = cy + 15;
            textLocation = 'En Route Highway';
          } else if (matched.status === 'Delivered') {
            markerX = 75;
            markerY = 80;
            textLocation = 'Delivered Destination';
          }

          setTrackingInfo({
            id: matched.id,
            status: matched.status,
            createdAt: matched.createdAt,
            totalPrice: matched.totalPrice,
            customerName: matched.deliveryDetails?.name || matched.userName,
            address: matched.deliveryDetails?.address || 'Customer Storefront',
            branch: activeBranch,
            driver: 'Kevin Hartanto',
            vehicle: 'Scania R450 Van',
            locX: markerX,
            locY: markerY,
            locText: textLocation,
            originX: cx,
            originY: cy
          });
        } else {
          setError(`No dispatch logs found matching "${shipmentId}". Verify the shipment ID.`);
        }
      } else {
        throw new Error('Failed to retrieve shipping database.');
      }
    } catch (err) {
      console.error(err);
      setError('Telemetry database offline. Please retry tracking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black font-display tracking-tight text-gray-900 uppercase">
          Location Tracking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your logistics dispatch routes and check branch locations in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDEBAR CONTROLS (Shop list & Search input) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. TRACKING INPUT CARD */}
          <div className="bg-white border border-gray-250 p-5 rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-600" /> Track Dispatch
            </h3>
            
            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Enter Shipment ID (e.g. SHP001)" 
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-black hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-all focus:outline-none"
              >
                {loading ? 'Locating...' : 'Track Order'}
              </button>
            </form>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-[10px] font-bold rounded-none border border-red-150 flex items-start gap-1.5 leading-normal">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 2. SHOP LOCATIONS CARD */}
          <div className="bg-white border border-gray-250 p-5 rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" /> Distributor Branches
            </h3>
            
            <div className="space-y-3">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShop(shop)}
                  className={`w-full text-left p-3 border rounded-none transition-all flex flex-col gap-1 ${
                    selectedShop.id === shop.id 
                      ? 'border-orange-600 bg-orange-50/20' 
                      : 'border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="font-extrabold text-xs text-gray-900">{shop.name}</span>
                  <span className="text-[10px] text-gray-450 leading-relaxed">{shop.address}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shop.color }}></span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Marker Pin</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* MAP & STATUS DETAIL CONTAINER (Right) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* VECTOR MAP PANEL */}
          <div className="bg-[#e5e9f0] border border-gray-250 rounded-none relative overflow-hidden h-[400px] shadow-inner flex items-center justify-center">
            
            {/* Background Map Roads SVG Grid */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-gray-300 select-none">
              {/* Landmass/water styling */}
              <rect width="100" height="100" fill="#e8edf2" />
              
              {/* River vector line */}
              <path d="M 0,90 Q 30,85 45,60 T 90,0" fill="none" stroke="#cad5e0" strokeWidth="6" strokeLinecap="round" />
              
              {/* Street grids */}
              <line x1="20" y1="0" x2="20" y2="100" stroke="#dae0e8" strokeWidth="1.5" />
              <line x1="40" y1="0" x2="40" y2="100" stroke="#dae0e8" strokeWidth="1.5" />
              <line x1="60" y1="0" x2="60" y2="100" stroke="#dae0e8" strokeWidth="1.5" />
              <line x1="80" y1="0" x2="80" y2="100" stroke="#dae0e8" strokeWidth="1.5" />
              
              <line x1="0" y1="30" x2="100" y2="30" stroke="#dae0e8" strokeWidth="1.5" />
              <line x1="0" y1="55" x2="100" y2="55" stroke="#dae0e8" strokeWidth="1.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#dae0e8" strokeWidth="1.5" />
              
              {/* Main Highway Express Route */}
              <path d="M 10,30 L 80,30 L 80,80 L 40,80 Z" fill="none" stroke="#b4c2d3" strokeWidth="2.5" strokeLinecap="round" />

              {/* ACTIVE SHIPMENT TRACKING PATHS */}
              {trackingInfo && (
                <>
                  {/* Route path from origin shop to vehicle location */}
                  <path 
                    d={`M ${trackingInfo.originX},${trackingInfo.originY} L ${trackingInfo.locX},${trackingInfo.locY}`} 
                    fill="none" 
                    stroke="#ff6b35" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeDasharray="4 2"
                  />
                  
                  {/* Complete road path connection to customer */}
                  <path 
                    d={`M ${trackingInfo.locX},${trackingInfo.locY} L 75,80`} 
                    fill="none" 
                    stroke="#1a202c" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    className="opacity-25"
                  />
                </>
              )}

              {/* Shop location markers */}
              {shops.map((shop) => {
                const isSelected = selectedShop.id === shop.id;
                return (
                  <g key={shop.id}>
                    {isSelected && <circle cx={shop.cx} cy={shop.cy} r="4" fill="none" stroke={shop.color} strokeWidth="1.5" className="animate-ping" />}
                    <circle cx={shop.cx} cy={shop.cy} r={isSelected ? "3" : "2"} fill={shop.color} stroke="#ffffff" strokeWidth="1" />
                    <text x={shop.cx + 3} y={shop.cy + 1} fill="#4a5568" fontSize="2.5" fontWeight="black" className="uppercase font-sans pointer-events-none">
                      {shop.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Customer Delivery destination point */}
              <circle cx="75" cy="80" r="3" fill="#1a202c" stroke="#ffffff" strokeWidth="1" />
              <text x="70" y="85" fill="#1a202c" fontSize="2.5" fontWeight="black" className="uppercase pointer-events-none">
                Destination
              </text>

              {/* VEHICLE LOCATOR PIN */}
              {trackingInfo && (
                <g className="animate-bounce">
                  <circle cx={trackingInfo.locX} cy={trackingInfo.locY} r="4" fill="#ff6b35" stroke="#ffffff" strokeWidth="1" />
                  <path d={`M ${trackingInfo.locX - 1},${trackingInfo.locY - 1.5} h2 v2 h-2 z`} fill="#ffffff" />
                </g>
              )}
            </svg>
            
            {/* Top Radar Watermark label */}
            <div className="absolute top-4 left-4 bg-black/80 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 tracking-wider">
              Satellite Radar Active
            </div>

            {/* Bottom floating details for highlighted shop */}
            {!trackingInfo && selectedShop && (
              <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-250 p-3 flex justify-between items-center shadow-md animate-in slide-in-from-bottom duration-250">
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wide">{selectedShop.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedShop.address}</p>
                </div>
                <div className="px-2.5 py-1 bg-gray-50 border text-[9px] font-black uppercase text-gray-600">
                  Shop Node
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE DISPATCH METRICS DETAILS */}
          {trackingInfo && (
            <div className="bg-white border border-gray-250 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              
              {/* Col 1: Shipment status */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-450 uppercase tracking-widest block">Shipment Status</span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-orange-600">{trackingInfo.status}</h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Location: {trackingInfo.locText}</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Carrier driver */}
              <div className="space-y-2 md:border-l md:pl-6 border-gray-100">
                <span className="text-[10px] font-black text-gray-450 uppercase tracking-widest block">Courier Courier</span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-gray-900">{trackingInfo.driver}</h4>
                  <p className="text-[10px] text-gray-400">Assigned Asset: {trackingInfo.vehicle}</p>
                </div>
              </div>

              {/* Col 3: Delivery address */}
              <div className="space-y-2 md:border-l md:pl-6 border-gray-100">
                <span className="text-[10px] font-black text-gray-450 uppercase tracking-widest block">Destination address</span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-gray-900 truncate">{trackingInfo.customerName}</h4>
                  <p className="text-[10px] text-gray-400 truncate">{trackingInfo.address}</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default LocationTracking;
