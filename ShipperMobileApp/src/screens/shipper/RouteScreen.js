import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const RouteScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Check if user is a shipper
  const isShipper = user?.role === 'shipper';

  if (!isShipper) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lộ trình giao hàng</Text>
          <Text style={styles.subtitle}>Quản lý tuyến đường giao hàng</Text>
        </View>
        
        <View style={styles.notShipperContainer}>
          <View style={styles.notShipperCard}>
            <Icon name="truck-delivery" size={64} color="#3b82f6" />
            <Text style={styles.notShipperTitle}>Chỉ dành cho Shipper</Text>
            <Text style={styles.notShipperSubtitle}>
              Tính năng lộ trình chỉ dành cho tài khoản shipper
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with gradient background */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lộ trình hôm nay</Text>
          <Text style={styles.headerSubtitle}>Quản lý hiệu quả các chuyến giao hàng</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Icon name="package-variant" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Tổng đơn</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Icon name="clock-outline" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Chờ lấy</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Icon name="truck-fast" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Đang giao</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
            <Icon name="check-circle" size={28} color="#ffffff" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#dbeafe' }]}
            onPress={() => {
              try {
                navigation.navigate('Orders');
              } catch (error) {
                console.log('Navigation error:', error);
              }
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <Icon name="clipboard-list" size={24} color="#ffffff" />
            </View>
            <Text style={styles.quickActionTitle}>Đơn hàng</Text>
            <Text style={styles.quickActionSubtitle}>Xem tất cả đơn hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#d1fae5' }]}
            onPress={() => {
              try {
                navigation.navigate('MapSettings');
              } catch (error) {
                console.log('Navigation error:', error);
              }
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10b981' }]}>
              <Icon name="map-marker-plus" size={24} color="#ffffff" />
            </View>
            <Text style={styles.quickActionTitle}>Bản đồ</Text>
            <Text style={styles.quickActionSubtitle}>Cài đặt bản đồ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#fef3c7' }]}
            onPress={() => {
              try {
                navigation.navigate('Orders', { initialTab: 'available' });
              } catch (error) {
                console.log('Navigation error:', error);
              }
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f59e0b' }]}>
              <Icon name="package-up" size={24} color="#ffffff" />
            </View>
            <Text style={styles.quickActionTitle}>Chờ lấy</Text>
            <Text style={styles.quickActionSubtitle}>Đơn chờ lấy hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: '#e9d5ff' }]}
            onPress={() => {
              try {
                navigation.navigate('Orders', { initialTab: 'active' });
              } catch (error) {
                console.log('Navigation error:', error);
              }
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf6' }]}>
              <Icon name="truck-delivery" size={24} color="#ffffff" />
            </View>
            <Text style={styles.quickActionTitle}>Đang giao</Text>
            <Text style={styles.quickActionSubtitle}>Đơn đang giao</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Route Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trạng thái tuyến đường</Text>
        
        <View style={styles.routeStatusCard}>
          <View style={styles.routeStatusHeader}>
            <Icon name="map-marker-path" size={32} color="#3b82f6" />
            <View style={styles.routeStatusInfo}>
              <Text style={styles.routeStatusTitle}>Sẵn sàng nhận đơn</Text>
              <Text style={styles.routeStatusSubtitle}>Hiện tại chưa có đơn hàng nào</Text>
            </View>
          </View>
          
          <View style={styles.routeProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.progressText}>0% hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mẹo giao hàng</Text>
        
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <Icon name="lightbulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              Kiểm tra thông tin khách hàng trước khi xuất phát
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Icon name="phone" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Gọi điện xác nhận trước khi đến địa chỉ giao hàng
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Icon name="map" size={20} color="#3b82f6" />
            <Text style={styles.tipText}>
              Sử dụng GPS để tìm đường tối ưu nhất
            </Text>
          </View>
        </View>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Not shipper styles
  notShipperContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  notShipperCard: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  notShipperTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  notShipperSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Header gradient
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  
  // Quick actions grid
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Route status
  routeStatusCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  routeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  routeStatusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  routeStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  routeStatusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  routeProgress: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Tips section
  tipsContainer: {
    paddingHorizontal: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 30,
  },
});

export default RouteScreen;