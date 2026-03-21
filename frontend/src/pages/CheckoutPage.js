import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../store/slices/orderSlice';
import { resetCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { formatVND } from '../utils/currency';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.orders);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'Vietnam',
    paymentMethod: 'cod',
    note: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const shippingCost = totalPrice > 500000 ? 0 : 30000;
  const taxPrice = Math.round(totalPrice * 0.1);
  const finalTotal = totalPrice + shippingCost + taxPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    toast.loading('Processing order...', { id: 'orderProcess' });

    let lat = null;
    let lon = null;

    const addressString = `${formData.street}, ${formData.city}, ${formData.country}`;
    const addressLower = addressString.toLowerCase();

    // Fallback dictionary for common test/demo addresses in this project
    const mockCoordinates = {
      '13/30': { latitude: 10.8486, longitude: 106.7121 }, // Thu Duc (Hiep Binh Phuoc / QL13)
      'hiệp bình phước': { latitude: 10.8486, longitude: 106.7121 },
      'hiệp phú': { latitude: 10.8435, longitude: 106.7135 }, // Thu Duc (Hiep Phu / Le Van Viet)
      'lê văn việt': { latitude: 10.8435, longitude: 106.7135 },
      'quận 1': { latitude: 10.7769, longitude: 106.7009 },
      'quận 3': { latitude: 10.7829, longitude: 106.6934 },
      'quận 4': { latitude: 10.7588, longitude: 106.7018 },
      'quận 5': { latitude: 10.7538, longitude: 106.6680 },
      'quận 6': { latitude: 10.7481, longitude: 106.6354 },
      'quận 7': { latitude: 10.7378, longitude: 106.6621 },
      'quận 8': { latitude: 10.7248, longitude: 106.6329 },
      'quận 10': { latitude: 10.7686, longitude: 106.6661 },
      'quận 11': { latitude: 10.7645, longitude: 106.6433 },
      'quận 12': { latitude: 10.8671, longitude: 106.6413 },
      'tân bình': { latitude: 10.8008, longitude: 106.6527 },
      'bình thạnh': { latitude: 10.8014, longitude: 106.7109 },
      'phú nhuận': { latitude: 10.7997, longitude: 106.6803 },
      'gò vấp': { latitude: 10.8291, longitude: 106.6622 },
      'tân phú': { latitude: 10.7942, longitude: 106.6277 },
      'bình tân': { latitude: 10.7595, longitude: 106.6026 },
      'thủ đức': { latitude: 10.8435, longitude: 106.7135 }, // Default Thu Duc to Hiep Phu area
    };

    // 1. Prepare search queries for cascading geocoding
    // Split the address components by comma and clean them
    const addressParts = [formData.street, formData.city, formData.state, formData.country]
      .filter(Boolean)
      .flatMap(part => part.split(','))
      .map(part => part.trim())
      .filter(part => part.length > 0);

    const searchQueries = [];
    
    // Q1: Exactly as entered (e.g., "13/30 Le Van Viet, Hiep Phu, Ho Chi Minh")
    if (addressParts.length > 0) {
      searchQueries.push(addressParts.join(', '));
    }
    
    // Q2: Strip the first part (often complex house numbers/alleys)
    if (addressParts.length > 1) {
      searchQueries.push(addressParts.slice(1).join(', '));
    }
    
    // Q3: Strip first two parts (e.g., Ward, District, City)
    if (addressParts.length > 2) {
      searchQueries.push(addressParts.slice(2).join(', '));
    }

    // Q4 (New): Ignore the City/State fields completely if they contradict the Street field.
    // E.g. Street: "Đông Hòa, Dĩ An", City: "Hồ Chí Minh" -> Search just "Đông Hòa, Dĩ An, Vietnam"
    const streetParts = formData.street ? formData.street.split(',').map(p => p.trim()).filter(Boolean) : [];
    if (streetParts.length >= 2) {
      searchQueries.push(`${streetParts.slice(-2).join(', ')}, ${formData.country || 'Vietnam'}`);
    } else if (streetParts.length === 1) {
      searchQueries.push(`${streetParts[0]}, ${formData.country || 'Vietnam'}`);
    }

    // Q5: Specifically just City/State level fallback
    if (formData.state || formData.city) {
      searchQueries.push(`${formData.city || formData.state}, ${formData.country || 'Vietnam'}`);
    }

    console.log("Geocoding cascading queries:", searchQueries);

    // 2. Try queries sequentially until OpenStreetMap returns a valid coordinate
    for (const query of searchQueries) {
      if (!query || query.trim() === '' || query === 'Vietnam') continue;
      
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`;
        const geoRes = await fetch(url);
        
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
            console.log(`✅ Geocoded successfully using query: "${query}" -> [${lat}, ${lon}]`);
            break; // Stop searching once matched!
          }
        }
      } catch (err) {
        console.error(`Geocoding failed for query "${query}":`, err);
      }
      
      // Delay slightly between queries to respect Nominatim API rate limits
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // 3. Optional local fallback if ALL external API queries somehow fail
    if (!lat || !lon) {
      for (const [key, coords] of Object.entries(mockCoordinates)) {
        // Use regex to prevent partial matches like 'quận 1' matching 'quận 10'
        const regexSuffix = /[0-9]$/.test(key) ? '(?![0-9])' : '';
        const regex = new RegExp(key + regexSuffix, 'i');

        if (regex.test(addressLower)) {
          lat = coords.latitude;
          lon = coords.longitude;
          console.log(`⚠️ Geocoding fell back to local mock data: ${key}`);
          break; // Match the first specific one
        }
      }
    }

    // 4. Absolute final fallback to Ho Chi Minh City center
    if (!lat || !lon) {
      console.log(`❌ All geocoding failed, falling back to HCMC center`);
      lat = 10.7769; // District 1, HCMC
      lon = 106.7009;
    }

    const orderData = {
      shippingAddress: {
        fullName: formData.fullName,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        latitude: lat,
        longitude: lon,
      },
      paymentMethod: formData.paymentMethod,
      note: formData.note,
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      dispatch(resetCart());
      toast.success('Order placed successfully!', { id: 'orderProcess' });
      navigate(`/orders/${result._id}`);
    } catch (error) {
      toast.error(error || 'Failed to place order', { id: 'orderProcess' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping Address
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery (COD)' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'momo', label: 'MoMo Wallet' },
                  { value: 'zalopay', label: 'ZaloPay' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${formData.paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-3 font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Notes (Optional)
              </h2>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="input"
                placeholder="Special instructions for delivery..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => {
                  const product = item.product;
                  const mainImage = product?.images?.find((img) => img.isMain) || product?.images?.[0];
                  return (
                    <div key={item._id} className="flex gap-3">
                      <img
                        src={mainImage?.url || 'https://via.placeholder.com/60'}
                        alt={product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {product?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x {formatVND(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatVND(item.quantity * item.price)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <hr className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : formatVND(shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span>{formatVND(taxPrice)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatVND(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isProcessing}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading || isProcessing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
