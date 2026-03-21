import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { useI18n } from '../i18n';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { items, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  const handleRemove = async (productId) => {
    if (window.confirm(t('common.confirmDelete') || 'Are you sure?')) {
      try {
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success(t('wishlist.removed'));
      } catch (error) {
        toast.error(t('common.error'));
      }
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(t('wishlist.addedToCart'));
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  if (loading && items.length === 0) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HeartIcon className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('wishlist.title')}</h1>
        </div>
      </div>

      {/* Wishlist Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">{t('wishlist.empty')}</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('wishlist.continue')}
          </button>
        </div>
      ) : (
        <>
          {/* Summary - Moved to Top */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-8 border border-blue-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-gray-600 mb-2">{t('wishlist.totalItems')}</p>
                <p className="text-4xl font-bold text-blue-600">{items.length}</p>
                <p className="text-sm text-gray-600 mt-1">{items.length === 1 ? 'item' : 'items'} in your wishlist</p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {t('wishlist.continueShopping')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative pt-full bg-gray-200 h-48 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {t('common.noData')}
                      </div>
                    )}
                    
                    {/* Favorite Badge */}
                    <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2">
                      <HeartIcon className="w-5 h-5 fill-current" />
                    </div>

                    {/* Discount Badge */}
                    {product.comparePrice && product.comparePrice > product.price && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </div>
                    )}
                  </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col h-full">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">
                      {product.category?.name || t('common.noData')}
                    </p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {product.price?.toLocaleString('vi-VN')} {t('common.currency')}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {product.comparePrice?.toLocaleString('vi-VN')} {t('common.currency')}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="mb-3">
                      {product.stock > 0 ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                          {t('wishlist.inStock')} ({product.stock})
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                          {t('wishlist.outOfStock')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingCartIcon className="w-4 h-4" />
                      <span className="text-sm">{t('wishlist.addToCart')}</span>
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default WishlistPage;
