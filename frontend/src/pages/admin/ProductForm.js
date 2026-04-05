import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../i18n';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, TrashIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  createEmptyProductFormData,
  deleteAdminProductImage,
  getAdminProductFormSeed,
  mapProductToFormData,
  saveAdminProduct,
  uploadAdminProductImages,
  validateProductImageFiles,
} from '../../services/adminProductService';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Images state
  const [existingImages, setExistingImages] = useState([]); // Images already on server
  const [newImages, setNewImages] = useState([]); // New files selected for upload
  const [newImagePreviews, setNewImagePreviews] = useState([]); // Previews for new files
  
  const [formData, setFormData] = useState(createEmptyProductFormData());

  const fetchFormSeed = useCallback(async () => {
    try {
      setLoading(true);
      const { categories: nextCategories, product } = await getAdminProductFormSeed(id);
      setCategories(nextCategories);

      if (product) {
        setFormData(mapProductToFormData(product));
        setExistingImages(product.images || []);
      }
    } catch (error) {
      toast.error(t('adminProductForm.errorLoading'));
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    fetchFormSeed();
  }, [fetchFormSeed]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const { validFiles, rejectedFiles } = validateProductImageFiles(files);

    rejectedFiles.forEach((fileName) => {
      toast.error(`File ${fileName} is too large (max 5MB)`);
    });

    setNewImages(prev => [...prev, ...validFiles]);
    
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageId) => {
    if (!window.confirm(t('adminProducts.deleteConfirm'))) return;

    try {
      await deleteAdminProductImage({ productId: id, imageId });
      setExistingImages(prev => prev.filter(img => img._id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productId = await saveAdminProduct({ productId: id, formData });
      await uploadAdminProductImages({ productId, files: newImages });
      
      toast.success(isEdit ? t('adminProductForm.updatedSuccess') : t('adminProductForm.createdSuccess'));
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || t('adminProductForm.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/admin/products')}
          className="group flex items-center text-gray-500 hover:text-blue-600 font-bold transition-all"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 mr-3 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
            <ArrowLeftIcon className="w-5 h-5" />
          </div>
          {t('common.back')}
        </button>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest">
            {isEdit ? 'Update Mode' : 'Creation Mode'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
              <h1 className="text-2xl font-black text-gray-900">
                {isEdit ? t('adminProductForm.editProduct') : t('adminProductForm.createProduct')}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Fill in the primary details of your product</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('adminProductForm.productName')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter product title..."
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('adminProductForm.description')} *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Describe your product in detail..."
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      {t('adminProductForm.category')} *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium appearance-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      {t('adminProductForm.brand')}
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Apple, Samsung, etc."
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    {t('adminProductForm.tags')}
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Separate tags with commas (e.g., new, best-seller, hot)"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing and Stock Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center">
              <CheckCircleIcon className="w-6 h-6 mr-2 text-blue-500" />
              Inventory & Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t('adminProductForm.price')} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    step="1000"
                    placeholder="0"
                    className="w-full pl-5 pr-14 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-black"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">VNĐ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t('adminProductForm.comparePrice')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleChange}
                    step="1000"
                    placeholder="0"
                    className="w-full pl-5 pr-14 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-400 font-bold line-through"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">VNĐ</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t('adminProductForm.stock')} *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-900 font-black"
                />
              </div>

              <label className="relative flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all group">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all"
                />
                <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                  {t('adminProductForm.isFeatured')}
                </span>
                <PhotoIcon className="w-5 h-5 ml-auto text-gray-400" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Media & Actions */}
        <div className="space-y-8">
          {/* Actions Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 sticky top-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all font-black shadow-lg shadow-blue-200/50 disabled:bg-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                t('common.update')
              ) : (
                t('common.create')
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all font-bold"
            >
              {t('common.cancel')}
            </button>

            {/* Image Upload Area */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Product Images</h3>
              
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="images"
                />
                <label 
                  htmlFor="images" 
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group-active:scale-95"
                >
                  <div className="p-3 bg-blue-50 rounded-2xl mb-3 group-hover:bg-blue-100 transition-colors">
                    <PhotoIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">{t('adminProductForm.addImages')}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">Max 5MB per file</p>
                </label>
              </div>

              {/* Image Previews */}
              <div className="space-y-4 mt-6">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Saved on Cloud</p>
                    <div className="grid grid-cols-2 gap-3">
                      {existingImages.map((img) => (
                        <div key={img._id} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                          <img
                            src={img.url}
                            alt="Product"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <button
                            type="button"
                            onClick={() => deleteExistingImage(img._id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 active:scale-90"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          {img.isMain && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImagePreviews.length > 0 && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center">
                      <CheckCircleIcon className="w-3 h-3 mr-1" /> New Selection
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-blue-100 group">
                          <img
                            src={preview}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/80 text-white rounded-xl shadow-lg hover:bg-gray-900 transition-all active:scale-90"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
