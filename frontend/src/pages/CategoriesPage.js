import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../store/slices/categorySlice';
import { useI18n } from '../i18n';
import {
  BookOpenIcon,
  TagIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  StarIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Category icon mapping
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  const iconProps = 'h-12 w-12';
  
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

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { categories, loading } = useSelector((state) => state.categories);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('shop.categories') || 'All Categories'}
          </h1>
          <p className="text-lg text-blue-100">
            Explore our wide range of product categories and find what you're looking for
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow animate-pulse p-8 h-64"
                />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Category Header */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(category.name)}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-gray-600 text-sm text-center">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Category Content */}
                  <div className="p-6">
                    {/* Subcategories */}
                    {category.children && category.children.length > 0 && (
                      <div className="mb-6">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === category._id ? null : category._id
                            )
                          }
                          className="flex items-center justify-between w-full mb-4"
                        >
                          <h3 className="font-semibold text-gray-800">
                            Subcategories
                          </h3>
                          <svg
                            className={`h-5 w-5 transition-transform ${
                              expandedId === category._id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </button>

                        {expandedId === category._id && (
                          <div className="space-y-2 mb-4">
                            {category.children.map((subcategory) => (
                              <Link
                                key={subcategory._id}
                                to={`/categories/${subcategory.slug}`}
                                className="flex items-center py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                              >
                                <span className="mr-2">•</span>
                                {subcategory.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      to={`/categories/${category.slug}`}
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors group"
                    >
                      Shop Now
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600">
                Please check back later for available categories
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="bg-white py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Shop by Category?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browsing by category helps you discover exactly what you need, with
              organized collections and easy filtering options
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Easy Navigation',
                description: 'Find products quickly with organized categories',
              },
              {
                title: 'Best Selection',
                description:
                  'Discover all items in your favorite product categories',
              },
              {
                title: 'Quick Filters',
                description: 'Filter by price, rating, and more within categories',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;
