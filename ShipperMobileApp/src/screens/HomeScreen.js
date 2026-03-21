import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Simple ProductCard component
const ProductCard = ({ product, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress}>
    <View style={styles.productImageContainer}>
      {product.image ? (
        <Image 
          source={{ uri: product.image }} 
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <Icon name="package-variant" size={32} color="#3b82f6" />
      )}
    </View>
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productBrand}>{product.brand}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.productPrice}>${product.price}</Text>
        {product.comparePrice && (
          <Text style={styles.comparePrice}>${product.comparePrice}</Text>
        )}
      </View>
      <View style={styles.stockContainer}>
        <Icon name="package-variant" size={8} color="#10b981" />
        <Text style={styles.stockText}>{product.stock} in stock</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Category Card component
const CategoryCard = ({ category, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[
      styles.categoryCard,
      isSelected && styles.categoryCardSelected
    ]} 
    onPress={onPress}
  >
    <View style={[
      styles.categoryIconContainer,
      isSelected && styles.categoryIconContainerSelected
    ]}>
      <Icon 
        name="shopping" 
        size={24} 
        color={isSelected ? "#ffffff" : "#3b82f6"} 
      />
    </View>
    <Text 
      style={[
        styles.categoryName,
        isSelected && styles.categoryNameSelected
      ]} 
      numberOfLines={2}
    >
      {category.name}
    </Text>
  </TouchableOpacity>
);

// Mock data
const mockProducts = [
  {
    _id: '1',
    name: 'Professional Yoga Mat',
    price: 39.99,
    comparePrice: 49.99,
    brand: 'FitnessGear',
    stock: 130,
    category: { _id: '5', name: 'Sports' },
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop',
  },
  {
    _id: '2',
    name: 'Adjustable Dumbbell Set',
    price: 199.99,
    comparePrice: 249.99,
    brand: 'PowerFit',
    stock: 50,
    category: { _id: '5', name: 'Sports' },
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
  },
  {
    _id: '3',
    name: 'Running Shoes',
    price: 119.99,
    comparePrice: 149.99,
    brand: 'RunFast',
    stock: 100,
    category: { _id: '3', name: 'Clothing' },
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
  },
  {
    _id: '4',
    name: 'Digital Marketing Mastery',
    price: 39.99,
    comparePrice: 49.99,
    brand: 'BusinessBooks',
    stock: 89,
    category: { _id: '1', name: 'Books' },
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop',
  },
  {
    _id: '5',
    name: 'JavaScript: The Complete Guide',
    price: 29.99,
    comparePrice: 39.99,
    brand: 'TechBooks',
    stock: 75,
    category: { _id: '1', name: 'Books' },
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=300&fit=crop',
  },
  {
    _id: '6',
    name: 'Wireless Headphones',
    price: 79.99,
    comparePrice: 99.99,
    brand: 'SoundMax',
    stock: 25,
    category: { _id: '2', name: 'Electronics' },
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
  },
];

const mockCategories = [
  { _id: '1', name: 'Books' },
  { _id: '2', name: 'Electronics' },
  { _id: '3', name: 'Clothing' },
  { _id: '4', name: 'Home & Garden' },
  { _id: '5', name: 'Sports' },
];

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [categories, setCategories] = useState(mockCategories);
  const [loading, setLoading] = useState(false);
  const [useRealAPI, setUseRealAPI] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);

  const filterProducts = () => {
    if (selectedCategory === null) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => {
        if (product.category && typeof product.category === 'object') {
          return product.category._id === selectedCategory;
        }
        return false;
      });
      setFilteredProducts(filtered);
    }
  };

  useEffect(() => {
    if (useRealAPI) {
      loadRealData();
    } else {
      // Filter products when category changes
      filterProducts();
    }
  }, [useRealAPI, selectedCategory, products]);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // Mock categories data for shipper app
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' },
        { _id: '3', name: 'Books', slug: 'books' },
      ];
      setCategories(mockCategories);

      // Mock products data for shipper app
      const mockProducts = [
        {
          _id: '1',
          name: 'Wireless Headphones',
          price: 79.99,
          images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' }],
          category: { _id: '1', name: 'Electronics' },
          brand: 'TechBrand',
          stock: 50,
        },
        {
          _id: '2',
          name: 'Smart Watch',
          price: 299.99,
          images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop' }],
          category: { _id: '1', name: 'Electronics' },
          brand: 'SmartTech',
          stock: 25,
        },
        {
          _id: '3',
          name: 'Bluetooth Speaker',
          price: 149.99,
          images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop' }],
          category: { _id: '1', name: 'Electronics' },
          brand: 'AudioPro',
          stock: 30,
        },
      ];

      const formattedProducts = mockProducts.map(product => ({
        ...product,
        image: product.images && product.images.length > 0
          ? product.images.find(img => img.isMain)?.url || product.images[0]?.url
          : null
      }));
      setProducts(formattedProducts);

      // Filter products after loading
      if (selectedCategory === null) {
        setFilteredProducts(formattedProducts);
      } else {
        const filtered = formattedProducts.filter(product => {
          if (product.category && typeof product.category === 'object') {
            return product.category._id === selectedCategory;
          }
          return false;
        });
        setFilteredProducts(filtered);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Lỗi', 'Sử dụng dữ liệu mẫu.');
      setUseRealAPI(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (useRealAPI) {
      await loadRealData();
    } else {
      setTimeout(() => {
        filterProducts();
        setRefreshing(false);
      }, 1000);
    }
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => console.log('Product pressed:', item.name)}
    />
  );

  const renderCategory = ({ item }) => (
    <CategoryCard
      category={item}
      isSelected={selectedCategory === item._id}
      onPress={() => {
        // Navigate to ShopScreen with selected category
        console.log('Navigating with category:', item._id, item.name);
        navigation.navigate('ShopTab', { selectedCategory: item._id });
      }}
    />
  );

  const getCurrentCategoryName = () => {
    if (selectedCategory === null) {
      return 'Featured Products';
    }
    const currentCategory = categories.find(cat => cat._id === selectedCategory);
    return currentCategory?.name || 'Products';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover Amazing Products</Text>
          <Text style={styles.heroSubtitle}>
            Shop the latest trends with the best prices. Quality guaranteed with fast delivery.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                console.log('Shop Now pressed, navigating to all products');
                navigation.navigate('ShopTab', { selectedCategory: 'all' });
              }}
            >
              <Text style={styles.primaryButtonText}>Shop Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                console.log('Browse Categories pressed');
                navigation.navigate('ShopTab', { selectedCategory: 'all' });
              }}
            >
              <Text style={styles.secondaryButtonText}>Browse Categories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Text style={styles.sectionSubtitle}>Find what you're looking for</Text>
        </View>
        <FlatList
          data={categories.slice(0, 5)}
          renderItem={renderCategory}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          style={styles.categoriesScrollView}
        />
      </View>

      {/* Featured Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {getCurrentCategoryName()}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {selectedCategory === null 
              ? 'Handpicked products just for you'
              : `${filteredProducts.length} products found`
            }
          </Text>

          {/* View All Button */}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              console.log('View All pressed, navigating with category:', selectedCategory || 'all');
              navigation.navigate('ShopTab', {
                selectedCategory: selectedCategory || 'all'
              });
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="arrow-right" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Icon name="loading" size={24} color="#3b82f6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts.slice(0, 6)}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productsList}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Features Section */}
      <View style={[styles.section, styles.featuresSection]}>
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="truck-delivery" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Free Shipping</Text>
            <Text style={styles.featureText}>Free shipping on orders over $50</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="shield-check" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Secure Payment</Text>
            <Text style={styles.featureText}>100% secure payment methods</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="refresh" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Easy Returns</Text>
            <Text style={styles.featureText}>30-day return policy</Text>
          </View>
        </View>
      </View>

      {/* Newsletter Section */}
      <View style={styles.newsletterSection}>
        <Text style={styles.newsletterTitle}>Subscribe to Our Newsletter</Text>
        <Text style={styles.newsletterSubtitle}>
          Get the latest updates on new products and upcoming sales
        </Text>
        <View style={styles.newsletterForm}>
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    backgroundColor: '#3b82f6',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginRight: 4,
  },
  categoriesList: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  categoriesScrollView: {
    height: 115,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    width: 100,
    minHeight: 105,
  },
  categoryCardSelected: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconContainerSelected: {
    backgroundColor: '#ffffff',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
    flexWrap: 'wrap',
    maxWidth: 85,
  },
  categoryNameSelected: {
    color: '#ffffff',
  },
  productsList: {
    paddingHorizontal: 0,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  productImageContainer: {
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
    lineHeight: 16,
  },
  productBrand: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  comparePrice: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 9,
    color: '#10b981',
    marginLeft: 3,
  },
  featuresSection: {
    backgroundColor: '#f9fafb',
  },
  featuresGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  featureCard: {
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  newsletterSection: {
    backgroundColor: '#3b82f6',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  newsletterSubtitle: {
    fontSize: 13,
    color: '#bfdbfe',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  newsletterForm: {
    width: '100%',
    maxWidth: 280,
  },
  subscribeButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default HomeScreen;