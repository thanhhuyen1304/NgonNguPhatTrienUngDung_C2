import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../store/slices/orderSlice';
import toast from 'react-hot-toast';
import { formatVND } from '../utils/currency';
import {
  applyCouponCode,
  buildOrderPayload,
  createMomoPayment,
  resolveShippingCoordinates,
} from '../services/checkoutService';

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
    country: user?.address?.country || 'Vietnam',
    paymentMethod: 'cod',
    note: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isCouponApplying, setIsCouponApplying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isProcessing && items.length === 0) {
      navigate('/cart');
    }
  }, [isProcessing, items.length, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const shippingCost = totalPrice > 500000 ? 0 : 30000;
  const taxPrice = Math.round(totalPrice * 0.1);
  const couponDiscount = couponInfo?.discountAmount || 0;
  const finalTotal = Math.max(0, totalPrice + shippingCost + taxPrice - couponDiscount);

  const handleMomoPayment = async (orderData) => {
    const payUrl = await createMomoPayment(orderData);
    toast.success('Đang chuyển đến MoMo...', { id: 'orderProcess' });
    window.location.href = payUrl;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsCouponApplying(true);
    setCouponError('');

    try {
      const couponData = await applyCouponCode({
        code: couponCode,
        orderAmount: totalPrice,
      });
      setCouponInfo(couponData);
      toast.success('Coupon applied successfully');
    } catch (error) {
      setCouponInfo(null);
      setCouponError(error.response?.data?.message || 'Coupon could not be applied');
    } finally {
      setIsCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInfo(null);
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    toast.loading('Processing order...', { id: 'orderProcess' });

    try {
      const coordinates = await resolveShippingCoordinates(formData);
      const orderData = buildOrderPayload({
        formData,
        coordinates,
        couponInfo,
      });

      if (formData.paymentMethod === 'momo') {
        await handleMomoPayment(orderData);
        return;
      }

      const result = await dispatch(createOrder(orderData)).unwrap();
      toast.success('Order placed successfully!', { id: 'orderProcess' });
      navigate(`/orders/${result._id}`);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === 'string' ? error : 'Failed to place order');

      toast.error(errorMessage, { id: 'orderProcess' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isProcessing && items.length === 0) {
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

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter coupon code"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCouponApplying}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isCouponApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
                  {couponInfo && (
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-700">
                      Coupon applied: <span className="font-semibold">{couponInfo.coupon.code}</span> — saved {formatVND(couponInfo.discountAmount)}.
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="ml-3 text-blue-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Coupon discount</span>
                    <span>-{formatVND(couponDiscount)}</span>
                  </div>
                )}
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
