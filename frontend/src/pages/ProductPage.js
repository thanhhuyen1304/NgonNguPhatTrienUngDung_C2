import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductBySlug, clearProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import { formatVND } from '../utils/currency';
import {
  StarIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const ProductPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { loading: cartLoading } = useSelector((state) => state.cart);
  const { items: wishlistItems, loading: wishlistLoading } = useSelector((state) => state.wishlist);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Check if product is in wishlist
  const isInWishlist = wishlistItems?.some(item => {
    const productId = item.product?._id || item.product;
    return product && productId === product._id;
  });

  useEffect(() => {
    dispatch(getProductBySlug(slug));

    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, slug]);

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }

    if (user?.role === 'admin') {
      toast.error('Quản trị viên không thể mua hàng');
      return;
    }

    try {
      await dispatch(addToCart({ productId: product._id, quantity })).unwrap();
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      toast.error(error?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
      return;
    }

    if (user?.role === 'admin') {
      toast.error('Quản trị viên không thể thêm vào danh sách yêu thích');
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        toast.success('Đã thêm vào danh sách yêu thích');
      }
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật danh sách yêu thích');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link
          to="/shop"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images || [];
  const currentImage = images[selectedImage]?.url || 'https://via.placeholder.com/600x600?text=No+Image';
  const discountPercentage = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-blue-600">Cửa hàng</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/categories/${product.category.slug}`}
              className="hover:text-blue-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{discountPercentage}%
              </span>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Category & Brand */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            {product.category && (
              <Link
                to={`/categories/${product.category.slug}`}
                className="hover:text-blue-600"
              >
                {product.category.name}
              </Link>
            )}
            {product.brand && (
              <>
                <span>•</span>
                <span>{product.brand}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                 {product.rating.toFixed(1)} ({product.numReviews} đánh giá)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-blue-600">
              {formatVND(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xl text-gray-400 line-through">
                {formatVND(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">
                 ✓ Còn hàng ({product.stock} sản phẩm)
               </span>
             ) : (
               <span className="text-red-600 font-medium">Hết hàng</span>
             )}
           </div>

          {/* Quantity & Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                 Thêm vào giỏ hàng
               </button>

              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                 title="Thêm vào danh sách yêu thích"
               >
                {isInWishlist ? (
                  <HeartIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartOutlineIcon className="h-6 w-6 text-gray-400 hover:text-red-500" />
                )}
              </button>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h3>
              <div className="space-y-2">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex">
                    <span className="w-32 text-gray-500">{spec.key}:</span>
                    <span className="text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Đánh giá của khách hàng
          </h2>
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review._id} className="border-b pb-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {review.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                       {review.user?.name || 'Ẩn danh'}
                     </p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600 ml-14">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
