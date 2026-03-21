import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, forceLogout } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [stats] = useState({
    totalOrders: 24,
    completedOrders: 20,
    pendingOrders: 4,
    totalEarnings: 2450000,
  });
  
  // Check user role
  const isShipper = user?.role === 'shipper';
  const isUser = user?.role === 'user';
  const isAdmin = user?.role === 'admin';

  // Debug log
  console.log('ProfileScreen - User:', user);
  console.log('ProfileScreen - User Role:', user?.role);
  console.log('ProfileScreen - isShipper:', isShipper);
  console.log('ProfileScreen - isUser:', isUser);
  console.log('ProfileScreen - isAdmin:', isAdmin);

  // Force reload user data on screen focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ProfileScreen focused, user role:', user?.role);
    });
    return unsubscribe;
  }, [navigation, user]);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('User confirmed logout');
              await dispatch(logout()).unwrap();
              console.log('Logout successful');
            } catch (error) {
              console.error('Logout error:', error);
              // Force logout even if API fails
              dispatch(forceLogout());
              Alert.alert('Thông báo', 'Đã đăng xuất khỏi thiết bị này.');
            }
          }
        },
      ]
    );
  };

  const handleEmergencyLogout = async () => {
    Alert.alert(
      'Đăng xuất khẩn cấp',
      'Chức năng này sẽ xóa tất cả dữ liệu đăng nhập trên thiết bị. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa dữ liệu', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage manually
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
              dispatch(forceLogout());
              Alert.alert('Thành công', 'Đã xóa tất cả dữ liệu đăng nhập.');
            } catch (error) {
              console.error('Emergency logout error:', error);
              dispatch(forceLogout());
              Alert.alert('Thông báo', 'Đã thực hiện đăng xuất khẩn cấp.');
            }
          }
        },
      ]
    );
  };

  const handleOrdersPress = () => {
    // Navigate to the Orders tab which handles both user and shipper orders
    navigation.navigate('OrdersTab');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleWishlist = () => {
    Alert.alert('Thông báo', 'Chức năng wishlist không khả dụng cho shipper');
  };

  const handleWallet = () => {
    Alert.alert('Ví tiền', `Số dư hiện tại: ${isShipper ? '2,450,000 VNĐ' : '150,000 VNĐ'}`);
  };

  const handlePromotions = () => {
    Alert.alert('Ưu đãi', 'Xem các chương trình khuyến mãi hiện có');
  };

  const handleSecurity = () => {
    Alert.alert('Bảo mật', 'Cài đặt bảo mật tài khoản');
  };

  const handleAddresses = () => {
    Alert.alert('Địa chỉ', 'Quản lý địa chỉ giao hàng');
  };

  const handlePaymentMethods = () => {
    Alert.alert('Thanh toán', 'Quản lý phương thức thanh toán');
  };

  const handleEarningsStats = () => {
    Alert.alert('Thống kê thu nhập', 'Xem báo cáo thu nhập chi tiết');
  };

  const handleWorkSchedule = () => {
    Alert.alert('Lịch làm việc', 'Quản lý lịch làm việc của bạn');
  };

  const handleRatings = () => {
    Alert.alert('Đánh giá', 'Xem đánh giá từ khách hàng');
  };

  const handlePurchaseHistory = () => {
    Alert.alert('Lịch sử mua hàng', 'Xem lịch sử các đơn hàng đã mua');
  };

  const handleProductReviews = () => {
    Alert.alert('Đánh giá sản phẩm', 'Quản lý đánh giá sản phẩm của bạn');
  };

  const handleBecomeShipper = () => {
    Alert.alert(
      'Trở thành đối tác giao hàng',
      'Bạn có muốn đăng ký trở thành đối tác giao hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng ký', onPress: () => navigation.navigate('ShipperRegistration') }
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert('Thông báo', 'Cài đặt thông báo');
  };

  const handleLanguage = () => {
    Alert.alert(
      'Ngôn ngữ',
      'Chọn ngôn ngữ hiển thị',
      [
        { text: 'Tiếng Việt', onPress: () => console.log('Vietnamese selected') },
        { text: 'English', onPress: () => console.log('English selected') },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleTheme = () => {
    Alert.alert(
      'Giao diện',
      'Chọn chế độ hiển thị',
      [
        { text: 'Sáng', onPress: () => console.log('Light theme selected') },
        { text: 'Tối', onPress: () => console.log('Dark theme selected') },
        { text: 'Tự động', onPress: () => console.log('Auto theme selected') },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleHelpCenter = () => {
    Alert.alert('Trung tâm trợ giúp', 'Tìm câu trả lời cho các câu hỏi thường gặp');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Liên hệ hỗ trợ',
      'Chọn phương thức liên hệ',
      [
        { text: 'Gọi điện', onPress: () => Alert.alert('Gọi điện', 'Hotline: 1900-1234') },
        { text: 'Email', onPress: () => Alert.alert('Email', 'support@ecommerce.com') },
        { text: 'Chat', onPress: () => Alert.alert('Chat', 'Mở chat hỗ trợ trực tuyến') },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'Về ứng dụng',
      'Ecommerce Shop v1.0.0\n\nỨng dụng mua sắm trực tuyến với dịch vụ giao hàng nhanh chóng.\n\n© 2024 Ecommerce Shop. All rights reserved.'
    );
  };

  const handleDebugAuth = () => {
    navigation.navigate('DebugAuth');
  };

  const handleShipperApplications = () => {
    navigation.navigate('ShipperApplications');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }}
              style={styles.avatar}
            />
            <View style={styles.statusBadge}>
              <Icon 
                name={isShipper ? 'truck-delivery' : isAdmin ? 'shield-account' : 'account'} 
                size={12} 
                color="#ffffff" 
              />
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={[styles.roleBadge, isShipper ? styles.shipperBadge : isAdmin ? styles.adminBadge : styles.userBadge]}>
              <Icon 
                name={isShipper ? 'truck-delivery' : isAdmin ? 'shield-account' : 'account'} 
                size={14} 
                color="#ffffff" 
              />
              <Text style={styles.roleText}>
                {isShipper ? 'Đối tác giao hàng' : isAdmin ? 'Quản trị viên' : 'Khách hàng'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Icon name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Stats Section - Different for User vs Shipper */}
        <View style={styles.statsContainer}>
          {isShipper ? (
            // Shipper Stats
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.completedOrders}</Text>
                <Text style={styles.statLabel}>Đơn đã giao</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Đơn cần giao</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{(stats.totalEarnings / 1000).toFixed(0)}K</Text>
                <Text style={styles.statLabel}>Thu nhập (VNĐ)</Text>
              </View>
            </>
          ) : (
            // User Stats
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>Tổng đơn hàng</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.completedOrders}</Text>
                <Text style={styles.statLabel}>Đã hoàn thành</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Đang xử lý</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleOrdersPress}
        >
          <View style={styles.actionIcon}>
            <Icon 
              name={isShipper ? 'truck-delivery' : 'package-variant'} 
              size={24} 
              color="#3b82f6" 
            />
          </View>
          <Text style={styles.actionText}>
            {isShipper ? 'Đơn cần giao' : 'Đơn hàng của tôi'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleWishlist}
        >
          <View style={styles.actionIcon}>
            <Icon name="heart" size={24} color="#ef4444" />
          </View>
          <Text style={styles.actionText}>Yêu thích</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleWallet}
        >
          <View style={styles.actionIcon}>
            <Icon name="wallet" size={24} color="#10b981" />
          </View>
          <Text style={styles.actionText}>Ví tiền</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePromotions}
        >
          <View style={styles.actionIcon}>
            <Icon name="gift" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.actionText}>Ưu đãi</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Sections */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <View style={styles.menuItemLeft}>
            <Icon name="account-edit" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Chỉnh sửa hồ sơ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSecurity}>
          <View style={styles.menuItemLeft}>
            <Icon name="lock-outline" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Bảo mật</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAddresses}>
          <View style={styles.menuItemLeft}>
            <Icon name="map-marker" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Địa chỉ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {!isShipper && (
          <TouchableOpacity style={styles.menuItem} onPress={handlePaymentMethods}>
            <View style={styles.menuItemLeft}>
              <Icon name="credit-card" size={24} color="#3b82f6" />
              <Text style={styles.menuItemText}>Thanh toán</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Shipper-specific section */}
      {isShipper && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Đối tác giao hàng</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEarningsStats}>
            <View style={styles.menuItemLeft}>
              <Icon name="chart-line" size={24} color="#10b981" />
              <Text style={styles.menuItemText}>Thống kê thu nhập</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleWorkSchedule}>
            <View style={styles.menuItemLeft}>
              <Icon name="clock-outline" size={24} color="#f59e0b" />
              <Text style={styles.menuItemText}>Lịch làm việc</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRatings}>
            <View style={styles.menuItemLeft}>
              <Icon name="star" size={24} color="#f59e0b" />
              <Text style={styles.menuItemText}>Đánh giá</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {/* User-specific section */}
      {!isShipper && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Mua sắm</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handlePurchaseHistory}>
            <View style={styles.menuItemLeft}>
              <Icon name="history" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Lịch sử mua hàng</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleProductReviews}>
            <View style={styles.menuItemLeft}>
              <Icon name="star-outline" size={24} color="#f59e0b" />
              <Text style={styles.menuItemText}>Đánh giá sản phẩm</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleBecomeShipper}>
            <View style={styles.menuItemLeft}>
              <Icon name="truck-delivery" size={24} color="#3b82f6" />
              <Text style={styles.menuItemText}>Trở thành đối tác giao hàng</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {/* Admin-specific section */}
      {isAdmin && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quản trị</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleShipperApplications}>
            <View style={styles.menuItemLeft}>
              <Icon name="account-check" size={24} color="#8b5cf6" />
              <Text style={styles.menuItemText}>Duyệt đăng ký Shipper</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <View style={styles.menuItemLeft}>
            <Icon name="bell-outline" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Thông báo</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLanguage}>
          <View style={styles.menuItemLeft}>
            <Icon name="translate" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Ngôn ngữ</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>Tiếng Việt</Text>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleTheme}>
          <View style={styles.menuItemLeft}>
            <Icon name="theme-light-dark" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Giao diện</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>Sáng</Text>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Hỗ trợ</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleHelpCenter}>
          <View style={styles.menuItemLeft}>
            <Icon name="help-circle-outline" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Trung tâm trợ giúp</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport}>
          <View style={styles.menuItemLeft}>
            <Icon name="phone" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Liên hệ hỗ trợ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAboutApp}>
          <View style={styles.menuItemLeft}>
            <Icon name="information-outline" size={24} color="#3b82f6" />
            <Text style={styles.menuItemText}>Về ứng dụng</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Debug option - only in development */}
        {__DEV__ && (
          <TouchableOpacity style={styles.menuItem} onPress={handleDebugAuth}>
            <View style={styles.menuItemLeft}>
              <Icon name="bug" size={24} color="#f59e0b" />
              <Text style={styles.menuItemText}>Debug Auth</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Logout */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]} 
          onPress={handleLogout}
          disabled={loading}
        >
          <View style={styles.menuItemLeft}>
            <Icon 
              name={loading ? "loading" : "logout"} 
              size={24} 
              color="#ef4444" 
            />
            <Text style={[styles.menuItemText, styles.logoutText]}>
              {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Emergency logout - only show if normal logout might have issues */}
        <TouchableOpacity 
          style={[styles.menuItem, styles.emergencyLogoutItem]} 
          onPress={handleEmergencyLogout}
          disabled={loading}
        >
          <View style={styles.menuItemLeft}>
            <Icon name="alert-circle" size={24} color="#dc2626" />
            <Text style={[styles.menuItemText, styles.emergencyLogoutText]}>
              Đăng xuất khẩn cấp
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  shipperBadge: {
    backgroundColor: '#3b82f6',
  },
  adminBadge: {
    backgroundColor: '#8b5cf6',
  },
  userBadge: {
    backgroundColor: '#10b981',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  logoutItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  logoutText: {
    color: '#ef4444',
  },
  emergencyLogoutItem: {
    borderBottomWidth: 0,
  },
  emergencyLogoutText: {
    color: '#dc2626',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default ProfileScreen;