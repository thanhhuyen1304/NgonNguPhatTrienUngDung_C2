import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const ShipperProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          }
        }
      ]
    );
  };

  const handleNavigation = (screen) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={80} color="#ffffff" />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Shipper'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'shipper@example.com'}</Text>
              <View style={styles.shipperBadge}>
                <Icon name="truck-delivery" size={16} color="#ffffff" />
                <Text style={styles.badgeText}>Đối tác giao hàng</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Icon name="check-circle" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Đã giao</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Icon name="star" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>5.0</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Icon name="currency-usd" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Thu nhập</Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => handleNavigation('EditProfile')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#3b82f6' }]}>
              <Icon name="account-edit" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Chỉnh sửa hồ sơ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => handleNavigation('ChangePassword')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' }]}>
              <Icon name="lock-reset" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' }]}>
              <Icon name="bell" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Thông báo</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={styles.switchContainer}>
              <View style={styles.switchOn}>
                <View style={styles.switchThumb} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Delivery Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt giao hàng</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => handleNavigation('MapSettings')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#10b981' }]}>
              <Icon name="map-marker-plus" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Cài đặt bản đồ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#ef4444' }]}>
              <Icon name="map-marker-radius" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Khu vực giao hàng</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>TP.HCM</Text>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#06b6d4' }]}>
              <Icon name="clock-outline" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Giờ làm việc</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>8:00 - 22:00</Text>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hiệu suất</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#10b981' }]}>
              <Icon name="chart-line" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Thống kê giao hàng</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' }]}>
              <Icon name="star-outline" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Đánh giá từ khách hàng</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' }]}>
              <Icon name="trophy" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Thành tích</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={styles.badgeSmall}>
              <Text style={styles.badgeSmallText}>Mới</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hỗ trợ</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#06b6d4' }]}>
              <Icon name="help-circle" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Trung tâm trợ giúp</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#10b981' }]}>
              <Icon name="phone" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Liên hệ hỗ trợ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' }]}>
              <Icon name="information" size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Về ứng dụng</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>v1.0.0</Text>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header styles
  headerGradient: {
    backgroundColor: '#3b82f6',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  shipperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Stats container
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  
  // Section styles
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  
  // Menu item styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
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
  
  // Switch styles
  switchContainer: {
    marginRight: 8,
  },
  switchOn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
  
  // Rating styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Badge styles
  badgeSmall: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeSmallText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  
  // Logout button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 30,
  },
});

export default ShipperProfileScreen;