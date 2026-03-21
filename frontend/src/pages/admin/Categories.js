import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../i18n';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories/admin/all');
      setCategories(response.data.data.categories || []);
    } catch (error) {
      toast.error(t('common.error') + ': Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, formData);
        toast.success(t('adminCategories.updatedSuccess'));
      } else {
        await api.post('/categories', formData);
        toast.success(t('adminCategories.createdSuccess'));
      }
      
      setFormData({ name: '', description: '', parent: '' });
      setEditId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success(t('adminCategories.deletedSuccess'));
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
      parent: category.parent?._id || '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('adminCategories.title')}</h1>
        <p className="text-gray-600 mt-1">{t('admin.addCategories')}</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editId ? t('adminCategories.editCategory') : t('adminCategories.createNew')}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminCategories.categoryName')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('adminCategories.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {editId ? t('common.update') : t('common.create')}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setFormData({ name: '', description: '', parent: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('adminCategories.categoryName')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('adminCategories.description')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('admin_table.products')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('admin_table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{category.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {category.productsCount || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-gray-600 hover:text-yellow-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors"
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
          <div className="p-8 text-center text-gray-600">{t('common.loading')}</div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
