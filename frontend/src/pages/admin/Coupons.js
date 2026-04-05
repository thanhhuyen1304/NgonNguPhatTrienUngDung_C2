import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../i18n';
import toast from 'react-hot-toast';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCoupons,
  updateAdminCoupon,
} from '../../services/adminCouponService';
import { 
  PencilIcon, 
  TrashIcon, 
  TicketIcon, 
  PlusIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminCoupons = () => {
  const { t } = useI18n();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);

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
      const couponList = await getAdminCoupons();
      setCoupons(couponList);
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
    setBtnLoading(true);

    try {
      if (editId) {
        await updateAdminCoupon(editId, formData);
        toast.success(t('adminCoupons.updatedSuccess') || 'Coupon updated successfully');
      } else {
        await createAdminCoupon(formData);
        toast.success(t('adminCoupons.createdSuccess') || 'Coupon created successfully');
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
    } finally {
      setBtnLoading(false);
    }
  };

  const initDelete = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!couponToDelete) return;

    try {
      await deleteAdminCoupon(couponToDelete._id);
      toast.success(t('adminCoupons.deletedSuccess') || 'Coupon deleted successfully');
      setIsDeleteOpen(false);
      setCouponToDelete(null);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <TicketIcon className="w-8 h-8 mr-3 text-indigo-600" />
            Coupon Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center">
             <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse" />
             Promotional Engines • Active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`p-6 border-b border-gray-50 bg-gray-50/50 ${editId ? 'bg-indigo-50/50' : 'bg-blue-50/50'}`}>
                <h3 className="text-lg font-black text-gray-900 flex items-center">
                  {editId ? <PencilIcon className="w-5 h-5 mr-2 text-indigo-500" /> : <PlusIcon className="w-5 h-5 mr-2 text-blue-500" />}
                  {editId ? 'Edit Coupon' : 'Create New Code'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    placeholder="e.g. SUMMER2024"
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold appearance-none bg-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Value *</label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Min Order</label>
                    <input
                      type="number"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-bold appearance-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="disabled">Disabled</option>
                  </select>
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.oncePerUser}
                        onChange={(e) => setFormData({ ...formData, oncePerUser: e.target.checked })}
                        className="w-5 h-5 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                      />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">Once Per User</span>
                   </label>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={btnLoading}
                    className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      editId 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                        : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100'
                    }`}
                  >
                    {btnLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : editId ? (
                      <><PencilIcon className="w-5 h-5 stroke-[2.5]" /> Update Coupon</>
                    ) : (
                      <><PlusIcon className="w-5 h-5 stroke-[2.5]" /> Create Coupon</>
                    )}
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
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-bold"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </form>
           </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
             {loading && coupons.length === 0 ? (
               <div className="p-32 flex flex-col items-center justify-center text-gray-400">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 opacity-50"></div>
                 <p className="font-bold tracking-widest text-xs uppercase italic">Loading coupons...</p>
               </div>
             ) : coupons.length === 0 ? (
               <div className="p-32 text-center">
                 <div className="bg-gray-50 inline-block p-8 rounded-full mb-4 text-gray-300">
                    <ArchiveBoxIcon className="w-16 h-16" />
                 </div>
                 <h4 className="text-xl font-bold text-gray-900 italic">No coupons found</h4>
                 <p className="text-gray-500 mt-1">Ready for a promotion? Create your first code.</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 border-b border-gray-50">
                     <tr>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Code Info</th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Reduction</th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Usage</th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {coupons.map((coupon) => (
                       <tr key={coupon._id} className="group hover:bg-indigo-50/30 transition-all duration-200">
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-2 h-14 rounded-full bg-indigo-500" />
                               <div>
                                 <p className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors text-lg tracking-tight">
                                   {coupon.code}
                                 </p>
                                 <div className="flex items-center mt-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    Exp: {new Date(coupon.endDate).toLocaleDateString()}
                                 </div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <TagIcon className="w-3 h-3 text-indigo-400" />
                                  <span className="text-sm font-black text-gray-900">
                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${coupon.discountValue.toLocaleString('vi-VN')} ₫`}
                                  </span>
                               </div>
                               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                  Min: {coupon.minOrderValue?.toLocaleString('vi-VN') || 0} ₫
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="inline-flex items-center px-4 py-1.5 bg-gray-100 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                               <ArchiveBoxIcon className="w-3 h-3 mr-2 text-gray-400 group-hover:text-indigo-500" />
                               <span className="text-xs font-black text-gray-700 group-hover:text-indigo-700">
                                 {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl italic border ${
                              coupon.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : coupon.status === 'expired'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {coupon.status}
                            </span>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                             <button
                               onClick={() => handleEdit(coupon)}
                               className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                             >
                               <PencilIcon className="w-5 h-5 stroke-[2.5]" />
                             </button>
                             <button
                               onClick={() => initDelete(coupon)}
                               className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                             >
                               <TrashIcon className="w-5 h-5 stroke-[2.5]" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Coupon"
        message={`Delete the coupon code "${couponToDelete?.code}"? This action is permanent.`}
        confirmText="Confirm Delete"
        cancelText="Keep Coupon"
        type="danger"
      />
    </div>
  );
};

export default AdminCoupons;
