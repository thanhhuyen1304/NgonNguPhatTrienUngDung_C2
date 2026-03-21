import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';

const statusOptions = [
  { value: 'pending', label: 'Chờ duyệt', color: '#f59e0b', bgColor: '#fef3c7' },
  { value: 'approved', label: 'Đã duyệt', color: '#10b981', bgColor: '#d1fae5' },
  { value: 'rejected', label: 'Đã từ chối', color: '#ef4444', bgColor: '#fee2e2' },
  { value: 'all', label: 'Tất cả', color: '#6b7280', bgColor: '#f3f4f6' },
];

const formatDate = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const ShipperApplicationsScreen = ({ navigation }) => {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState([]);

  const pendingCount = useMemo(
    () => applications.filter((u) => u?.shipperInfo?.status === 'pending').length,
    [applications]
  );

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/shipper-applications?status=${encodeURIComponent(status)}`);
      setApplications(res.data?.data?.applications || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không tải được danh sách đơn đăng ký shipper');
      console.error('Fetch applications error:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const approve = async (userId, userName) => {
    Alert.alert(
      'Duyệt đơn đăng ký',
      `Bạn có chắc chắn muốn duyệt đơn đăng ký của ${userName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Duyệt',
          style: 'default',
          onPress: async () => {
            try {
              await api.put(`/users/shipper-applications/${userId}/approve`);
              Alert.alert('Thành công', 'Đã duyệt đơn đăng ký');
              fetchApplications();
            } catch (error) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Duyệt đơn thất bại');
            }
          },
        },
      ]
    );
  };

  const reject = async (userId, userName) => {
    Alert.alert(
      'Từ chối đơn đăng ký',
      `Bạn có chắc chắn muốn từ chối đơn đăng ký của ${userName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/users/shipper-applications/${userId}/reject`);
              Alert.alert('Thành công', 'Đã từ chối đơn đăng ký');
              fetchApplications();
            } catch (error) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Từ chối đơn thất bại');
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (statusValue) => {
    return statusOptions.find(opt => opt.value === statusValue) || statusOptions[3];
  };

  const renderApplicationCard = ({ item }) => {
    const info = item.shipperInfo || {};
    const statusValue = info.status || 'pending';
    const statusConfig = getStatusConfig(statusValue);
    const isPending = statusValue === 'pending';

    return (
      <View style={styles.applicationCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRole}>Role: {item.role}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {info.phone || item.phone || 'Chưa có số điện thoại'}
            </Text>
          </View>
        </View>

        {/* Shipper Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin shipper</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="motorbike" size={16} color="#3b82f6" />
              <Text style={styles.infoLabel}>Phương tiện:</Text>
              <Text style={styles.infoValue}>{info.vehicleType || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="card-text" size={16} color="#3b82f6" />
              <Text style={styles.infoLabel}>Biển số:</Text>
              <Text style={styles.infoValue}>{info.licensePlate || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="star" size={16} color="#3b82f6" />
              <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
              <Text style={styles.infoValue}>{info.experience ?? 0} năm</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="clock" size={16} color="#3b82f6" />
              <Text style={styles.infoLabel}>Giờ làm:</Text>
              <Text style={styles.infoValue}>{info.workingHours || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Application Date */}
        <View style={styles.dateSection}>
          <Icon name="calendar" size={16} color="#6b7280" />
          <Text style={styles.dateText}>
            Đăng ký: {formatDate(info.applicationDate)}
          </Text>
        </View>

        {/* Actions */}
        {isPending && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => approve(item._id, item.name)}
            >
              <Icon name="check" size={16} color="#ffffff" />
              <Text style={styles.approveButtonText}>Duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => reject(item._id, item.name)}
            >
              <Icon name="close" size={16} color="#ffffff" />
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-list-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Không có đơn đăng ký</Text>
      <Text style={styles.emptySubtitle}>
        {status === 'pending' 
          ? 'Chưa có đơn đăng ký nào đang chờ duyệt'
          : 'Không có đơn đăng ký nào với trạng thái này'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Duyệt đăng ký Shipper</Text>
          <Text style={styles.headerSubtitle}>
            Hiển thị: {applications.length}
            {status === 'pending' && ` (chờ duyệt: ${pendingCount})`}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Trạng thái:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={(itemValue) => setStatus(itemValue)}
            style={styles.picker}
          >
            {statusOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Applications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 40,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});

export default ShipperApplicationsScreen;