import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../store/slices/productSlice';
import { getCategories } from '../store/slices/categorySlice';
import { useI18n } from '../i18n';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/common/Loading';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  BookOpenIcon,
  TagIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  StarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

// Category icon mapping
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  const iconProps = 'h-5 w-5';
  
  if (name.includes('book')) {
    return <BookOpenIcon className={iconProps} />;
  } else if (name.includes('clothing') || name.includes('cloth')) {
    return <TagIcon className={iconProps} />;
  } else if (name.includes('electronic')) {
    return <ComputerDesktopIcon className={iconProps} />;
  } else if (name.includes('home') || name.includes('garden')) {
    return <SparklesIcon className={iconProps} />;
  } else if (name.includes('sport')) {
    return <StarIcon className={iconProps} />;
  } else {
    return <ShoppingBagIcon className={iconProps} />;
  }
};

const ShopPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { t } = useI18n();

  const { products, pagination, loading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
    showAll: searchParams.get('showAll') === 'true',
  });

  useEffect(() => {
    dispatch(getCategories({ parentOnly: 'true' }));
  }, [dispatch]);

  // Sync filter when slug changes
  useEffect(() => {
    if (slug && categories.length > 0) {
      const category = categories.find((c) => c.slug === slug);
      if (category) {
        setFilters((prev) => ({
          ...prev,
          category: category._id,
          page: 1,
        }));
      }
    } else if (!slug) {
      // If no slug, clear category filter
      setFilters((prev) => ({
        ...prev,
        category: '',
        page: 1,
      }));
    }
  }, [slug, categories]);

  useEffect(() => {
    const params = { ...filters, limit: filters.showAll ? 1000 : 12 };

    // Remove empty/null values but keep page if set
    Object.keys(params).forEach((key) => {
      if (!params[key]) {
        delete params[key];
      }
    });

    dispatch(getProducts(params));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    // Only reset page when changing category, price, search, or showAll
    const resetPage = ['category', 'minPrice', 'maxPrice', 'search', 'showAll'].includes(key);
    
    // Convert price values to numbers
    let processedValue = value;
    if (['minPrice', 'maxPrice'].includes(key)) {
      processedValue = value ? String(value) : '';
    }
    
    const newFilters = { 
      ...filters, 
      [key]: processedValue, 
      ...(resetPage && { page: 1 })
    };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && k !== 'page' && k !== 'showAll') params.set(k, v); // Don't add page and showAll to URL
      if (k === 'showAll' && v) params.set(k, 'true');
    });
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v); // Only add non-page params
    });
    if (page > 1) params.set('page', page);
    setSearchParams(params);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
      showAll: false,
    });
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: t('shop.sort') },
    { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
    { value: 'bestselling', label: 'Bán chạy nhất' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('shop.filters')}</h3>
              {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('shop.filters')} làm lại
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('shop.categories')}</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={!filters.category}
                    onChange={() => handleFilterChange('category', '')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-600">{t('common.all')}</span>
                </label>
                {categories.map((category) => (
                  <label key={category._id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === category._id}
                      onChange={() => handleFilterChange('category', category._id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-1 text-gray-400">{getCategoryIcon(category.name)}</span>
                    <span className="ml-1 text-gray-600">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('shop.priceRange')}</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <span className="text-gray-400 self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {filters.category 
                  ? categories.find((c) => c._id === filters.category)?.name || t('shop.title')
                  : t('shop.title')
                }
              </h1>
              <p className="text-gray-600">
                {filters.showAll 
                  ? `Hiển thị tất cả ${pagination.total} sản phẩm`
                  : `${pagination.total} sản phẩm tìm thấy`
                }
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Show All Toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.showAll}
                  onChange={(e) => handleFilterChange('showAll', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-gray-700">Hiển thị tất cả</span>
              </label>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700"
              >
                <FunnelIcon className="h-5 w-5" />
                {t('shop.filters')}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 text-gray-700 cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {filters.search && (
            <div className="mb-4 text-gray-600">
              Kết quả tìm kiếm cho: <strong>"{filters.search}"</strong>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && !filters.showAll && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('common.previous')}
                    </button>
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-2 rounded-lg ${
                          pagination.page === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('common.next')}
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">{t('shop.noProducts')}</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Xoá bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{t('shop.filters')}</h2>
              <button onClick={() => setFilterOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto h-full pb-32">
              {/* Categories */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category-mobile"
                      checked={!filters.category}
                      onChange={() => handleFilterChange('category', '')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-600">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={filters.category === category._id}
                        onChange={() => handleFilterChange('category', category._id)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-1 text-gray-400">{getCategoryIcon(category.name)}</span>
                      <span className="ml-1 text-gray-600">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <span className="text-gray-400 self-center">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
