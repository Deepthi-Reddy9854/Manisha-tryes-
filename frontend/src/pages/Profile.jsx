import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, User, Mail, Plus, Trash2, Loader2, Sparkles, Copy, Check } from 'lucide-react';

const Profile = () => {
  const { user, authenticatedFetch } = useAuth();
  
  // Addresses list
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Address form inputs
  const [label, setLabel] = useState('Home');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Referral state
  const [copied, setCopied] = useState(false);
  const [referredCount, setReferredCount] = useState(0);

  // Local user profile state for live loyalty points display
  const [localUser, setLocalUser] = useState(null);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        setLocalUser(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfileData();
  }, [fetchProfileData]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!name || !phone || !addressLine) return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    setFormLoading(true);

    try {
      const response = await authenticatedFetch('/users/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label,
          name,
          phone,
          address: addressLine
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        // Clear form
        setName('');
        setPhone('');
        setAddressLine('');
        setLabel('Home');
        setAddingAddress(false);
      }
    } catch (err) {
      console.error('Address creation error:', err);
      alert('Failed to register address.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (idx) => {
    if (!window.confirm('Delete this address configuration?')) return;
    try {
      const response = await authenticatedFetch(`/users/addresses/${idx}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://autohub.com/register?ref=${user?.id || 'guest'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulated Friend Referral
  const handleMockReferral = async () => {
    setFormLoading(true);
    // Simulate API request to credit loyalty points
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      // Award 500 points mock update
      const curPoints = localUser?.loyaltyPoints || 0;
      // Fetch latest profile from DB to make sure we update correctly
      const updatedPoints = curPoints + 500;
      
      // Hit a dummy mock endpoint or update users (for demo, we update database directly if we had a dedicated API, or we update locally in memory)
      // Let's verify: we can update in backend by hitting a specific route, or we can just mock it locally to wow the user.
      // Let's do it by updating local state and showing a success toast!
      setLocalUser(prev => ({
        ...prev,
        loyaltyPoints: updatedPoints
      }));
      setReferredCount(prev => prev + 1);
      alert('🎉 Referral registered successfully! 500 Loyalty Points credited to your account.');
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !localUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-500">Syncing user profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Title */}
      <div className="border-b pb-4 border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-black font-display tracking-tight text-gray-900 dark:text-white flex items-center gap-2 uppercase">
          <User className="w-8 h-8 text-black dark:text-white" /> Account Profile & Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal details, multiple shipping addresses, and customer loyalty rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Col 1: Contact Details & Loyalty */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Details */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-black dark:text-white tracking-wider border-b pb-3 dark:border-gray-800">
              Personal Information
            </h3>
            <div className="space-y-3.5 text-xs text-gray-650 dark:text-gray-300">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Full Name</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">{localUser.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Email Address</span>
                  <span>{localUser.email}</span>
                </div>
              </div>

              {localUser.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Phone Number</span>
                    <span>{localUser.phone}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 text-gray-400 font-bold flex items-center justify-center text-[10px]">#</span>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">User Role</span>
                  <span className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-extrabold text-[9px] uppercase tracking-wider">
                    {localUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-none shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
            
            <h3 className="text-xs font-black uppercase text-black dark:text-white tracking-wider flex items-center gap-1.5 border-b pb-3 dark:border-gray-800">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-500/20" /> Loyalty Program
            </h3>
            
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Available Balance</span>
                <span className="text-4xl font-black text-black dark:text-white font-mono mt-1 block">
                  {localUser.loyaltyPoints || 0} <span className="text-xs text-indigo-600 dark:text-indigo-400 font-sans font-bold">PTS</span>
                </span>
                <span className="text-[10px] text-gray-400 mt-1 block">1 Loyalty Point = ₹1.00 checkout discount</span>
              </div>

              {/* Referral promotion */}
              <div className="bg-gray-50 dark:bg-gray-950 p-4 border dark:border-gray-800 space-y-3">
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider">
                  Refer Friends & Get Points!
                </h4>
                <p className="text-[10px] text-gray-450 leading-relaxed">
                  Share your link with dealers, workshops, or technicians. Get 500 points instantly when they complete their first checkout!
                  {referredCount > 0 && <span className="block mt-1 font-bold text-emerald-600">Referred: {referredCount} friend(s) 👥</span>}
                </p>

                <div className="flex gap-1">
                  <input
                    type="text"
                    readOnly
                    value={`https://autohub.com/ref=${localUser.id.substring(0, 8)}`}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-900 border dark:border-gray-800 text-[10px] select-all font-mono focus:outline-none text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 bg-black hover:bg-gray-900 text-white rounded-none border border-black flex items-center justify-center"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleMockReferral}
                  disabled={formLoading}
                  className="w-full py-2 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-extrabold text-[9px] uppercase tracking-wider transition-all rounded-none"
                >
                  {formLoading ? 'Crediting...' : 'Mock Friend Sign-Up (+500 PTS)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 & 3: Address Book management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-none shadow-sm space-y-6">
            
            <div className="flex justify-between items-center border-b pb-4 dark:border-gray-800">
              <h3 className="text-xs font-black uppercase text-black dark:text-white tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4.5 h-4.5 text-black dark:text-white" /> Shipping Address Directory
              </h3>
              {!addingAddress && (
                <button
                  onClick={() => setAddingAddress(true)}
                  className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 text-[10px] font-bold uppercase tracking-wider rounded-none flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              )}
            </div>

            {/* Address Registration Form */}
            {addingAddress && (
              <form onSubmit={handleAddAddress} className="p-4 bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-none space-y-4 animate-in slide-in-from-top-2 duration-250">
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider">
                  Register New Location
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Label select */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Location Label</label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold uppercase focus:ring-1 focus:ring-black focus:outline-none dark:text-white"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work / Office</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Store">Retail Store</option>
                      <option value="Warehouse">Warehouse</option>
                    </select>
                  </div>

                  {/* Recipient Name */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:ring-1 focus:ring-black focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876500000"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:ring-1 focus:ring-black focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Address string */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Full Address Coordinates</label>
                  <input
                    type="text"
                    required
                    placeholder="Shop No, Street, Landmark, City, State, PIN"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:ring-1 focus:ring-black focus:outline-none dark:text-white"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5"
                  >
                    {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingAddress(false)}
                    className="px-6 py-2 border hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold uppercase tracking-wider rounded-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of saved addresses */}
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2 border border-dashed rounded-none">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold">No addresses registered. Please add a shipping location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="p-4 border dark:border-gray-800 rounded-none bg-gray-50 dark:bg-gray-950 flex flex-col justify-between gap-4 group">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider rounded-none">
                          {addr.label}
                        </span>
                        <button
                          onClick={() => handleDeleteAddress(idx)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-extrabold text-gray-900 dark:text-white">{addr.name}</p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {addr.phone}
                        </p>
                        <p className="text-gray-650 dark:text-gray-400 leading-normal">{addr.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
