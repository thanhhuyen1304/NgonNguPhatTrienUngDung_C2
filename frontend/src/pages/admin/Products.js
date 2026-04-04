import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrophyIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductDetailModal from '../../components/admin/ProductDetailModal';

const AdminProducts = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15, // Slightly lower limit for better performance/layout
        ...(search && { search }),
        ...(category && { category }),
      });

      const response = await api.get(`/products/admin/all?${params}`);
      setProducts(response.data.data.products);
      setTotalPages(response.data.data.pagination.pages || 1);
    } catch (error) {
      toast.error(`${t('common.error')}: Không thể tải danh sách sản phẩm`);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const initDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!productToDelete) return;

    try {
      await api.delete(`/products/${productToDelete._id}`);
      toast.success(t('adminProducts.deletedSuccess'));
      setIsDeleteOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section with Icons & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <ArchiveBoxIcon className="w-8 h-8 mr-3 text-blue-600" />
            {t('adminProducts.title')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
            {t('admin.allProducts')} • Live Catalog
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="group inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 hover:shadow-blue-200"
        >
          <PlusIcon className="w-5 h-5 stroke-[3]" />
          {t('adminProducts.addProduct')}
        </button>
      </div>

      {/* Modern Filter Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t('adminProducts.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-bold text-gray-900"
            />
          </div>
          <div className="relative group">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-bold text-gray-900 appearance-none bg-white"
            >
              <option value="">{t('adminProducts.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-32 flex flex-col items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 opacity-50"></div>
            <p className="font-bold tracking-widest text-xs uppercase italic">{t('common.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-32 text-center">
            <div className="bg-gray-100 inline-block p-8 rounded-full mb-4 text-gray-300">
              <ArchiveBoxIcon className="w-16 h-16" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 italic">{t('adminProducts.noProducts')}</h4>
            <p className="text-gray-500 mt-1">Start by adding your first product to the gallery.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">
                      {t('adminProducts.productName')}
                    </th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">
                       Category
                    </th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">
                      {t('adminProducts.priceColumn')}
                    </th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">
                      Stock
                    </th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">
                      {t('admin_table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="group hover:bg-blue-50/30 transition-all duration-200">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-14 rounded-full bg-blue-500" />
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <PhotoIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 truncate max-w-[250px] group-hover:text-blue-700 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{product.brand || 'Original Brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 uppercase tracking-widest italic">
                          {product.category?.name || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-2">
                              {product.comparePrice > product.price && (
                                <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                                  -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                                </span>
                              )}
                              <span className="text-sm font-black text-gray-900 tracking-tight">
                                {product.price.toLocaleString('vi-VN')} <span className="text-[10px] text-gray-400">VNĐ</span>
                              </span>
                           </div>
                           {product.comparePrice > product.price && (
                             <span className="text-[10px] text-gray-400 line-through font-bold">
                                {product.comparePrice.toLocaleString('vi-VN')}
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl ${product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                           {product.stock < 10 ? <ExclamationCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4 text-gray-400" />}
                           <span className="text-xs font-black">{product.stock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => handleOpenDetail(product)}
                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                            title={t('common.view')}
                          >
                            <EyeIcon className="w-5 h-5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                            title={t('common.edit')}
                          >
                            <PencilIcon className="w-5 h-5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => initDelete(product)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                            title={t('common.delete')}
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

            {/* Pagination Grid */}
            {totalPages > 1 && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Page <span className="text-gray-900">{page}</span> OF {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-wider text-gray-500 active:scale-95"
                  >
                    PREV
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                     const pNum = i + 1;
                     // Simple pagination logic for brevity
                     if (totalPages > 5 && (pNum > 3 && pNum < totalPages)) return null;
                     return (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={`w-10 h-10 rounded-xl transition-all font-black text-xs active:scale-90 shadow-sm ${
                            page === pNum
                              ? 'bg-blue-600 text-white shadow-blue-200'
                              : 'bg-white text-gray-500 hover:border-blue-400'
                          }`}
                        >
                          {pNum}
                        </button>
                     );
                  })}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-wider text-gray-500 active:scale-95"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strategic Footer Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
               <TrophyIcon className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-center md:text-left">
               <h4 className="text-2xl font-black italic tracking-tight">Strategic Catalog Management</h4>
               <p className="text-blue-100/70 text-sm mt-2 font-medium max-w-xl">
                 Optimized product listings with accurate inventory counts lead to a <span className="text-white font-black underline decoration-blue-500">30% faster checkout process</span>. Ensure all your entries have high-quality images and clear descriptions.
               </p>
            </div>
            <div className="md:ml-auto">
               <button 
                onClick={() => navigate('/admin/dashboard')}
                className="px-8 py-3 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-lg shadow-black/20"
               >
                 View Analytics
               </button>
            </div>
         </div>
      </div>

      {/* Modals & Dialogs */}
      <ProductDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        product={selectedProduct} 
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title={t('adminProducts.deleteConfirm')}
        message={`${t('common.confirmDelete')} \n "${productToDelete?.name}" \n\n This product will be removed permanentely from the catalog.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
};

export default AdminProducts;
