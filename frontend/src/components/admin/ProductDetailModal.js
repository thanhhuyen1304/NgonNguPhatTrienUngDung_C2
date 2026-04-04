import React from 'react';
import { 
  XMarkIcon, 
  CubeIcon, 
  TagIcon, 
  BanknotesIcon, 
  ArchiveBoxIcon, 
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useI18n } from '../../i18n';

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const { t } = useI18n();
  if (!isOpen || !product) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {t('adminProducts.productDetails')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400'} 
                  alt={product.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />
                {!product.isActive && (
                  <div className="absolute top-4 right-4 bg-gray-900/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    {t('adminProducts.inactive')}
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-blue-500 transition-all cursor-pointer bg-gray-50">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Badges/Stats */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">{t('adminProducts.soldColumn')}</p>
                  <p className="text-2xl font-black text-emerald-900">{product.sold || 0}</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">{t('adminProducts.stockColumn')}</p>
                  <p className="text-2xl font-black text-indigo-900">{product.stock || 0}</p>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col h-full space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mb-3 uppercase tracking-widest">
                    {product.category?.name || 'General'}
                  </span>
                  <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-gray-500 font-medium mt-1">{product.brand || 'No Brand'}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-blue-600">
                    {product.price?.toLocaleString('vi-VN')} VNĐ
                  </span>
                  {product.comparePrice > product.price && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200 w-fit mb-1 uppercase tracking-tighter">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% Discount
                      </span>
                      <span className="text-sm text-gray-400 line-through font-medium">
                        {product.comparePrice?.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 flex-grow">
                <div>
                  <h4 className="flex items-center text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                    <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                    {t('adminProductForm.description')}
                  </h4>
                  <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl max-h-60 overflow-y-auto border border-gray-100 italic">
                    {product.description || 'No description provided.'}
                  </div>
                </div>

                {/* Specs/Meta */}
                <div className="grid grid-cols-1 gap-y-3 pt-4">
                  <div className="flex items-center justify-between text-sm py-2 group">
                    <span className="text-gray-500 flex items-center">
                      <TagIcon className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" /> {t('common.id')}
                    </span>
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                      {product._id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 group border-t border-gray-50">
                    <span className="text-gray-500 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" /> {t('common.createdAt')}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatDate(product.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 group border-t border-gray-50">
                    <span className="text-gray-500 flex items-center">
                      < GlobeAltIcon className="w-4 h-4 mr-2 group-hover:text-blue-500 transition-colors" /> Slug
                    </span>
                    <span className="font-medium text-blue-600 hover:underline cursor-default">
                      {product.slug}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
