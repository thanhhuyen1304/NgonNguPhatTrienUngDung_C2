import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    oncePerUser: false,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    status: 'active',
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons');
      setCoupons(response.data.data.coupons || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await api.put(`/coupons/${editId}`, formData);
        toast.success('Coupon updated successfully');
      } else {
        await api.post('/coupons', formData);
        toast.success('Coupon created successfully');
      }
      setEditId(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        oncePerUser: false,
        startDate: '',
        endDate: '',
        usageLimit: 0,
        status: 'active',
      });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditId(coupon._id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || 0,
      oncePerUser: coupon.oncePerUser || false,
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : '',
      usageLimit: coupon.usageLimit || 0,
      status: coupon.status || 'active',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;

    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coupon management</h1>
        <p className="text-gray-600 mt-1">Create, update and manage coupon codes.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{editId ? 'Edit coupon' : 'Create new coupon'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount value *</label>
              <input
                type="number"
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum discount</label>
              <input
                type="number"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum order value</label>
              <input
                type="number"
                min="0"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage limit</label>
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.oncePerUser}
                onChange={(e) => setFormData({ ...formData, oncePerUser: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              Limit one use per user
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <span>Status</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {editId ? 'Update coupon' : 'Create coupon'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setFormData({
                    code: '',
                    discountType: 'percentage',
                    discountValue: 0,
                    minOrderValue: 0,
                    maxDiscount: 0,
                    oncePerUser: false,
                    startDate: '',
                    endDate: '',
                    usageLimit: 0,
                    status: 'active',
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Code</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Value</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Min order</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Used / Limit</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">{coupon.discountType.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')} ₫`}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{coupon.minOrderValue?.toLocaleString('vi-VN') || 0} ₫</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{coupon.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 rounded-md text-gray-600 hover:text-blue-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="p-2 rounded-md text-gray-600 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="p-6 text-center text-gray-600">Loading coupons...</div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
