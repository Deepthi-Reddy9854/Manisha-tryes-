import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../context/AuthContext';
import { Star, Truck, ShieldCheck, Warehouse, Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [homeReviews, setHomeReviews] = useState([]);

  const searchParams = new URLSearchParams(location.search);
  const activeSection = searchParams.get('section') || '';

  const contactFormRef = useRef(null);

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Fetch Feedback Reviews for Homepage
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/feedback`);
        if (response.ok) {
          const data = await response.json();
          setHomeReviews(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  // Scroll to active section when rendered
  useEffect(() => {
    if (activeSection) {
      const targetId = activeSection === 'about' ? 'about-section' : activeSection === 'contact' ? 'contact-footer' : activeSection === 'feedback' ? 'feedback-section' : '';
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [activeSection]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setContactError('Please fill out all required fields.');
      return;
    }
    setContactLoading(true);
    setContactError('');
    setContactSuccess(false);

    // Simulate API request submission
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      
      // Auto-scroll to the top of the contact form card so the success alert is visible
      contactFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Auto-hide success alert after 6 seconds
      setTimeout(() => {
        setContactSuccess(false);
      }, 6000);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 font-sans">
      
      {/* Hero Banner (Dealership Showroom Cover) */}
      {!activeSection && (
        <div 
          className="relative h-[420px] bg-cover bg-center flex items-center rounded-[32px] overflow-hidden shadow-lg border border-gray-250 dark:border-gray-800"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1617854818583-09e7f077a156?auto=format&fit=crop&q=80&w=1200')` }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
          
          <div className="relative z-10 max-w-xl px-8 md:px-12 space-y-4 text-white animate-in fade-in slide-in-from-left duration-300">
            <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">THE BIGGEST CHOICE ON THE WEB</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase font-display">
              UPGRADE YOUR RIDE WITH TOP-QUALITY CAR GEAR
            </h2>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
              Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula et tempor congue, eros est euismod turpis.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => navigate('/products')}
                className="px-8 py-3 bg-white text-black font-extrabold hover:bg-indigo-650 hover:text-white transition-all duration-300 uppercase text-xs tracking-wider rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-95"
              >
                SHOP NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Promos */}
      {!activeSection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Promo 1: Flash Sales */}
          <div 
            className="relative h-[250px] bg-cover bg-center flex items-center rounded-3xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
            <div className="relative z-10 p-8 text-white space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">FLASH SALES</h3>
              <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/products')}
                  className="px-6 py-2.5 bg-white text-black font-extrabold hover:bg-indigo-650 hover:text-white transition-all duration-300 uppercase text-[10px] tracking-wider rounded-xl border-none shadow-sm active:scale-95"
                >
                  SHOP NOW
                </button>
              </div>
            </div>
          </div>

          {/* Promo 2: Best Product */}
          <div 
            className="relative h-[250px] bg-cover bg-center flex items-center rounded-3xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
            <div className="relative z-10 p-8 text-white space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">BEST PRODUCT</h3>
              <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/products')}
                  className="px-6 py-2.5 bg-white text-black font-extrabold hover:bg-indigo-650 hover:text-white transition-all duration-300 uppercase text-[10px] tracking-wider rounded-xl border-none shadow-sm active:scale-95"
                >
                  SHOP NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Preview Section */}
      {activeSection === 'feedback' && homeReviews.length > 0 && (
        <div id="feedback-section" className="border-t border-gray-200 dark:border-gray-800 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
          <h3 className="font-black text-xl uppercase tracking-wider text-black dark:text-white">CUSTOMER TESTIMONIALS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeReviews.map((rev) => (
              <div key={rev.id} className="glass-panel hover-lift p-6 space-y-4 rounded-3xl">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wide truncate max-w-[150px]">{rev.userName}</span>
                  <div className="flex items-center space-x-0.5 text-indigo-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${rev.rating >= s ? 'fill-indigo-550 stroke-indigo-550 fill-indigo-550' : 'stroke-gray-250 dark:stroke-gray-700 fill-transparent'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Us Highlight Section */}
      {activeSection === 'about' && (
        <div id="about-section" className="space-y-12 animate-in fade-in slide-in-from-bottom duration-300">
          {/* Top Hero Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-900 p-8 md:p-12 rounded-[32px] shadow-sm">
            <div className="space-y-4">
              <span className="text-xs font-black tracking-widest text-indigo-500 uppercase">OUR MISSION</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-950 dark:text-white uppercase leading-tight font-display">
                Driving Wholesale Automotive Logistics Forward
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Auto Nexus is built to resolve key supply chain constraints in retail automobile spare parts, lubricants, and tyres. We connect global parts manufacturers directly to regional garages, delivery operators, and stores.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                By maintaining unified inventory tracking, high-performance warehousing, and robust carrier connections, we ensure our dealer network stays stocked, active, and efficient.
              </p>
            </div>
            
            {/* Visual stats layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl text-center space-y-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">12+</span>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Regional Hubs</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl text-center space-y-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">50+</span>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Partner Brands</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl text-center space-y-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">10K+</span>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Active Clients</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl text-center space-y-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">99.8%</span>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">On-Time Dispatches</p>
              </div>
            </div>
          </div>

          {/* Cards section (Core values) */}
          <div className="space-y-6">
            <h3 className="font-black text-xl uppercase tracking-wider text-black dark:text-white text-center">OUR OPERATIONS SYSTEM</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-8 space-y-4 rounded-3xl hover-lift">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                  <Warehouse className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-black dark:text-white uppercase tracking-wide">Wholesale Logistics</h4>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Secure inventory storage across multiple state-of-the-art warehouses, featuring temperature-controlled zones for oils and lubricants and optimized layout structures for fast parts picking.
                </p>
              </div>
              <div className="glass-panel p-8 space-y-4 rounded-3xl hover-lift">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-black dark:text-white uppercase tracking-wide">Express Distribution</h4>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Same-day regional supply transfers and secure courier deliveries to guarantee high availability at local dealer counters. Real-time GPS transponder telemetry tracking on all active carriers.
                </p>
              </div>
              <div className="glass-panel p-8 space-y-4 rounded-3xl hover-lift">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-black dark:text-white uppercase tracking-wide">Genuine OEM Quality</h4>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  100% certified product lines direct from authorized manufacturers. Every tyre, battery, spark plug, and lubricant batch goes through quality checks before reaching the store.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Footer Section */}
      {activeSection === 'contact' && (
        <div id="contact-footer" className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start animate-in fade-in slide-in-from-bottom duration-300">
          {/* Left panel (Details Info Card) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-[32px] p-8 md:p-10 space-y-8 shadow-sm">
            <div className="space-y-2">
              <span className="text-xs font-black tracking-widest text-indigo-500 uppercase">GET IN TOUCH</span>
              <h3 className="text-3xl font-black text-gray-950 dark:text-white uppercase leading-none font-display">Contact Us</h3>
              <p className="text-xs text-gray-400">Have questions about retail parts supplies or fleet logistics? Reach out directly.</p>
            </div>
            
            <div className="space-y-6">
              {/* Phone item */}
              <a href="tel:9849643618" className="flex items-center gap-4 group p-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-955 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Call Support</span>
                  <span className="text-sm font-extrabold text-gray-850 dark:text-gray-250 group-hover:text-indigo-650 transition-colors">98496 43618</span>
                </div>
              </a>
              
              {/* Email item */}
              <a href="mailto:Manishamaxx@gmail.com" className="flex items-center gap-4 group p-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-955 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-sm font-extrabold text-gray-850 dark:text-gray-250 group-hover:text-indigo-650 transition-colors truncate block max-w-[200px] md:max-w-none">Manishamaxx@gmail.com</span>
                </div>
              </a>
              
              {/* Location item */}
              <div className="flex items-center gap-4 p-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Office Location</span>
                  <span className="text-sm font-extrabold text-gray-850 dark:text-gray-250">Manisha Tyres & Lubricants, Korutla</span>
                </div>
              </div>

              {/* Hours item */}
              <div className="flex items-center gap-4 p-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Business Hours</span>
                  <span className="text-sm font-extrabold text-gray-850 dark:text-gray-250">Mon - Sat: 9:00 AM - 8:00 PM</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6 border-gray-100 dark:border-gray-850">
              <span className="text-[10px] font-bold text-gray-400 uppercase">AUTO NEXUS LOGISTICS HUB</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">© 2026 Auto Nexus. Built under certified manufacturer standards for parts supply lines.</p>
            </div>
          </div>

          {/* Right panel (Interactive Contact Form) */}
          <div ref={contactFormRef} className="lg:col-span-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-[32px] p-8 md:p-10 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-850">Send a Message</h3>
            
            {contactError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs border border-red-100 dark:border-red-900">
                {contactError}
              </div>
            )}
            
            {contactSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs border border-emerald-100 dark:border-emerald-900 animate-in fade-in duration-300">
                Thank you! Your message has been sent successfully. Our distributor desk will respond shortly.
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Email Address *</label>                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  placeholder="What is this inquiry regarding?"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Message *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Write your query details here..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-955 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={contactLoading}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600"
              >
                {contactLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Query</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
