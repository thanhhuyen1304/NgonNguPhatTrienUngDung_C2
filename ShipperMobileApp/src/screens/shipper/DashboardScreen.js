import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    ordersDelivered: 12,
    earnings: 450000,
    distance: 85.5,
    rating: 4.8,
    activeOrders: 3,
    completionRate: 95
  });

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          await dispatch(logout());
        },
        style: 'destructive',
      },
    ]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3b82f6']}
          tintColor="#3b82f6"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.shipperName}>{user?.name || 'Shipper'}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Đang hoạt động</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Icon name="logout" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          {/* Today's Earnings */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <Icon name="currency-usd" size={24} color="#10b981" />
              <Text style={styles.earningsLabel}>Thu nhập hôm nay</Text>
            </View>
            <Text style={styles.earningsAmount}>
              {formatCurrency(todayStats.earnings)}
            </Text>
            <Text style={styles.earningsSubtext}>
              {todayStats.ordersDelivered} đơn hàng • {todayStats.distance} km
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Icon name="check-circle" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>{todayStats.ordersDelivered}</Text>
            <Text style={styles.statLabel}>Đã giao</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Icon name="truck-delivery" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>{todayStats.activeOrders}</Text>
            <Text style={styles.statLabel}>Đang giao</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
            <Icon name="star" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>{todayStats.rating}</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hiệu suất hôm nay</Text>
        
        <View style={styles.metricCard}>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
                <Icon name="map-marker-distance" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.metricLabel}>Quãng đường</Text>
                <Text style={styles.metricValue}>{todayStats.distance} km</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%', backgroundColor: '#3b82f6' }]} />
              </View>
            </View>
          </View>
          
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricIcon, { backgroundColor: '#d1fae5' }]}>
                <Icon name="percent" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.metricLabel}>Tỷ lệ hoàn thành</Text>
                <Text style={styles.metricValue}>{todayStats.completionRate}%</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '95%', backgroundColor: '#10b981' }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#3b82f6' }]}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <Icon name="clipboard-list" size={32} color="#ffffff" />
            <Text style={styles.actionTitle}>Đơn hàng</Text>
            <Text style={styles.actionSubtitle}>Xem tất cả đơn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('RouteTab')}
          >
            <Icon name="map" size={32} color="#ffffff" />
            <Text style={styles.actionTitle}>Lộ trình</Text>
            <Text style={styles.actionSubtitle}>Xem đường đi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Icon name="account-cog" size={32} color="#ffffff" />
            <Text style={styles.actionTitle}>Cài đặt</Text>
            <Text style={styles.actionSubtitle}>Hồ sơ & tùy chọn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#8b5cf6' }]}
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          >
            <Icon name="chart-line" size={32} color="#ffffff" />
            <Text style={styles.actionTitle}>Thống kê</Text>
            <Text style={styles.actionSubtitle}>Báo cáo chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#d1fae5' }]}>
              <Icon name="check-circle" size={16} color="#10b981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Đã giao đơn hàng #ORD-001</Text>
              <Text style={styles.activityTime}>5 phút trước</Text>
            </View>
            <Text style={styles.activityAmount}>+25.000đ</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#fef3c7' }]}>
              <Icon name="truck" size={16} color="#f59e0b" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Bắt đầu giao đơn #ORD-002</Text>
              <Text style={styles.activityTime}>15 phút trước</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
              <Icon name="package-variant" size={16} color="#3b82f6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Nhận đơn hàng mới #ORD-003</Text>
              <Text style={styles.activityTime}>30 phút trước</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mẹo giao hàng</Text>
        
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Icon name="lightbulb" size={20} color="#f59e0b" />
            <Text style={styles.tipTitle}>Mẹo hôm nay</Text>
          </View>
          <Text style={styles.tipContent}>
            Liên hệ khách hàng trước khi đến để xác nhận địa chỉ và thời gian giao hàng phù hợp.
          </Text>
        </View>
      </View>

      {/* Bottom Spacing */}
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
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  shipperName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Earnings card
  earningsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  earningsSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  
  // Section styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  
  // Metric card
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressContainer: {
    width: 80,
    marginLeft: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Activity card
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  
  // Tip card
  tipCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginLeft: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 30,
  },
});

export default DashboardScreen;