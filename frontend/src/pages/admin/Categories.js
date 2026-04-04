import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../i18n';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  TagIcon, 
  FolderIcon,
  ArchiveBoxIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminCategories = () => {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories/admin/all');
      setCategories(response.data.data.categories || []);
    } catch (error) {
      toast.error(`${t('common.error')}: Không thể tải danh mục`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, formData);
        toast.success(t('adminCategories.updatedSuccess'));
      } else {
        await api.post('/categories', formData);
        toast.success(t('adminCategories.createdSuccess'));
      }
      
      setFormData({ name: '', description: '' });
      setEditId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setBtnLoading(false);
    }
  };

  const initDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!categoryToDelete) return;

    try {
      await api.delete(`/categories/${categoryToDelete._id}`);
      toast.success(t('adminCategories.deletedSuccess'));
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  const handleEdit = (category) => {
    setEditId(category._id);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <TagIcon className="w-8 h-8 mr-3 text-blue-600" />
            {t('adminCategories.title')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">{t('admin.addCategories')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column: Left/Fixed on Desktop */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`p-6 border-b border-gray-50 bg-gray-50/50 ${editId ? 'bg-indigo-50/50' : 'bg-blue-50/50'}`}>
              <h3 className="text-lg font-black text-gray-900 flex items-center">
                {editId ? <PencilIcon className="w-5 h-5 mr-2 text-indigo-500" /> : <PlusIcon className="w-5 h-5 mr-2 text-blue-500" />}
                {editId ? t('adminCategories.editCategory') : t('adminCategories.createNew')}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {t('adminCategories.categoryName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  placeholder="e.g. Smartphones"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {t('adminCategories.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Briefly describe this category..."
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium italic"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={btnLoading}
                  className={`w-full py-3.5 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    editId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {btnLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editId ? (
                    <><PencilIcon className="w-4 h-4" /> {t('common.update')}</>
                  ) : (
                    <><PlusIcon className="w-4 h-4" /> {t('common.create')}</>
                  )}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ name: '', description: '' });
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

        {/* List Column: Right/Main on Desktop */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             {loading && categories.length === 0 ? (
               <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                 <p className="font-medium">Loading catalog...</p>
               </div>
             ) : categories.length === 0 ? (
               <div className="p-20 text-center">
                 <div className="bg-gray-50 inline-block p-6 rounded-full mb-4 text-gray-300">
                    <ArchiveBoxIcon className="w-16 h-16" />
                 </div>
                 <h4 className="text-xl font-bold text-gray-900">{t('adminCategories.noCategories')}</h4>
                 <p className="text-gray-500 mt-1 italic">Start by creating your first category.</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 border-b border-gray-100">
                     <tr>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">
                         {t('adminCategories.categoryName')}
                       </th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">
                         {t('adminCategories.description')}
                       </th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">
                         {t('admin_table.products')}
                       </th>
                       <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">
                         {t('admin_table.actions')}
                       </th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {categories.map((category) => (
                       <tr key={category._id} className="group hover:bg-blue-50/30 transition-all duration-200">
                         <td className="px-6 py-5">
                            <div className="flex items-center">
                               <div className="w-2 h-10 rounded-full mr-4 bg-blue-500" />
                               <div>
                                 <p className="font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                                   {category.name}
                                 </p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-sm text-gray-500 italic max-w-xs truncate hidden md:table-cell">
                           {category.description || '—'}
                         </td>
                         <td className="px-6 py-5 text-center">
                            <div className="inline-flex items-center px-4 py-1.5 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                              <ArchiveBoxIcon className="w-3 h-3 mr-2 text-gray-400 group-hover:text-blue-500" />
                              <span className="text-xs font-black text-gray-700 group-hover:text-blue-700">
                                {category.productsCount || 0}
                              </span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                             <button
                               onClick={() => handleEdit(category)}
                               className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                               title={t('common.edit')}
                             >
                               <PencilIcon className="w-5 h-5" />
                             </button>
                             <button
                               onClick={() => initDelete(category)}
                               className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                               title={t('common.delete')}
                             >
                               <TrashIcon className="w-5 h-5" />
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
          
          <div className="mt-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                   <TrophyIcon className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-xl font-black">Simplified Catalog</h4>
                   <p className="text-blue-100 text-sm mt-1">A flat category structure makes it easier for customers to discover products quickly.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title={t('adminCategories.deleteConfirm')}
        message={`${t('common.confirmDelete')} \n "${categoryToDelete?.name}" \n\n This action cannot be undone.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
};

export default AdminCategories;
