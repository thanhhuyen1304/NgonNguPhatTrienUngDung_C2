import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import shipperService from '../services/shipperService';
import { formatVND } from '../utils/currency';
import { safeGoBack } from '../utils/navigationUtils';

const OrderDetailScreen = ({ navigation, route }) => {
  const { order, isShipper } = route.params;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Debug logging to check order data
  console.log('🔍 OrderDetailScreen - Order data:', JSON.stringify(order, null, 2));
  console.log('🔍 OrderDetailScreen - isShipper:', isShipper);
  console.log('🔍 OrderDetailScreen - User:', user);

  // Validate order data
  if (!order) {
    console.error('❌ No order data provided');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => safeGoBack(navigation)}
          >
            <Icon name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Icon name="alert-circle" size={64} color="#ef4444" />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 16, textAlign: 'center' }}>
            Không tìm thấy thông tin đơn hàng
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
            Vui lòng quay lại và thử lại
          </Text>
        </View>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'in_progress': return '#3b82f6';
      case 'in_transit': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'confirmed': return 'check-outline';
      case 'shipped': return 'truck-fast';
      case 'in_progress': return 'truck-delivery';
      case 'in_transit': return 'truck-fast';
      case 'delivered': return 'check-circle';
      case 'cancelled': return 'close-circle';
      default: return 'package';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Chờ lấy hàng';
      case 'shipped': return 'Đang vận chuyển';
      case 'in_progress': return 'Đang giao';
      case 'in_transit': return 'Đang vận chuyển';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'accept':
        Alert.alert(
          'Nhận đơn hàng',
          `Bạn có muốn nhận đơn hàng ${order.orderNumber}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Nhận đơn', 
              onPress: async () => {
                try {
                  // Update to shipped status when accepting
                  const response = await shipperService.updateOrderByShipper(order._id, {
                    status: 'shipped',
                    note: `Đơn hàng được nhận bởi ${user?.name || 'shipper'}`,
                  });
                  
                  if (response.success) {
                    console.log('Order status updated to shipped');
                    safeGoBack(navigation);
                  } else {
                    Alert.alert('Lỗi', response.message || 'Không thể nhận đơn hàng');
                  }
                } catch (error) {
                  console.error('Error accepting order:', error);
                  Alert.alert('Lỗi', 'Không thể nhận đơn hàng');
                }
              }
            }
          ]
        );
        break;
      case 'ship':
        Alert.alert(
          'Bắt đầu giao hàng',
          'Xác nhận bắt đầu giao hàng?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Bắt đầu', 
              onPress: () => {
                // Just mark as delivery started locally
                setDeliveryStarted(true);
                Alert.alert('Thành công', 'Đã bắt đầu giao hàng. Bạn có thể hoàn thành đơn hàng khi giao xong.');
              }
            }
          ]
        );
        break;
      case 'complete':
        Alert.alert(
          'Hoàn thành đơn hàng',
          'Xác nhận đã giao hàng thành công?',
          [
            { text: 'Chưa', style: 'cancel' },
            { 
              text: 'Đã giao', 
              onPress: async () => {
                try {
                  const response = await shipperService.updateOrderByShipper(order._id, {
                    status: 'delivered',
                    note: `Đơn hàng đã được giao thành công bởi ${user?.name || 'shipper'}`,
                  });
                  
                  if (response.success) {
                    console.log('Order status updated to delivered');
                    safeGoBack(navigation);
                  } else {
                    Alert.alert('Lỗi', response.message || 'Không thể hoàn thành đơn hàng');
                  }
                } catch (error) {
                  console.error('Error completing order:', error);
                  Alert.alert('Lỗi', 'Không thể hoàn thành đơn hàng');
                }
              }
            }
          ]
        );
        break;
      case 'start_delivery':
        Alert.alert(
          'Bắt đầu giao hàng',
          'Xác nhận bắt đầu giao hàng?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Bắt đầu', 
              onPress: async () => {
                try {
                  const response = await shipperService.updateOrderByShipper(order._id, {
                    status: 'shipped',
                    note: `Bắt đầu giao hàng bởi ${user?.name || 'shipper'}`,
                  });
                  
                  if (response.success) {
                    console.log('Order status updated to shipped');
                    safeGoBack(navigation);
                  } else {
                    Alert.alert('Lỗi', response.message || 'Không thể bắt đầu giao hàng');
                  }
                } catch (error) {
                  console.error('Error starting delivery:', error);
                  Alert.alert('Lỗi', 'Không thể bắt đầu giao hàng');
                }
              }
            }
          ]
        );
        break;
      case 'cancel':
        setShowCancelModal(true);
        break;
      case 'track':
        navigation.navigate('Tracking', { order });
        break;
      case 'call':
        console.log('Call customer:', order.customer?.phone || order.user?.phone || order.shippingAddress?.phone);
        break;
      case 'review':
        console.log('Review order:', order._id);
        break;
    }
  };

  const confirmCancel = () => {
    console.log('Cancel order:', order._id);
    console.log('Order cancelled');
    setShowCancelModal(false);
    safeGoBack(navigation);
  };

  const renderUserOrderDetail = () => (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => safeGoBack(navigation)}
        >
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Order Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={20} color="#ffffff" />
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <Text style={styles.orderDate}>Đặt ngày: {order.orderDate}</Text>
        {order.estimatedDelivery && (
          <Text style={styles.estimatedDelivery}>
            Dự kiến giao: {order.estimatedDelivery}
          </Text>
        )}
        {order.deliveryDate && (
          <Text style={styles.deliveryDate}>
            Đã giao: {order.deliveryDate}
          </Text>
        )}
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
        {(order.items || []).map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatVND(item.price)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
        <View style={styles.addressCard}>
          <Icon name="map-marker" size={20} color="#3b82f6" />
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{order.shippingAddress?.fullName || order.shippingAddress?.name || 'Khách hàng'}</Text>
            <Text style={styles.addressPhone}>{order.shippingAddress?.phone || 'N/A'}</Text>
            <Text style={styles.addressText}>{
              order.shippingAddress?.address || 
              (order.shippingAddress?.street && order.shippingAddress?.city ? 
                order.shippingAddress.street + ', ' + order.shippingAddress.city : null) || 
              'Địa chỉ không có'
            }</Text>
          </View>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('Map', { 
              order: {
                ...order,
                pickupLocation: order.pickupAddress || 'Store ABC, 456 Nguyen Hue St',
                deliveryLocation: order.shippingAddress?.address || 
                  (order.shippingAddress?.street && order.shippingAddress?.city ? 
                    `${order.shippingAddress.street}, ${order.shippingAddress.city}` : null) ||
                  order.address ||
                  'Địa chỉ giao hàng'
              }
            })}
          >
            <Icon name="map" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tạm tính</Text>
            <Text style={styles.paymentValue}>
              {formatVND((order.total - (order.shippingFee || 0)))}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{formatVND(order.shippingFee || 0)}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatVND(order.total)}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Icon name="credit-card" size={16} color="#6b7280" />
            <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionSection}>
        {order.status === 'in_transit' && (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleAction('track')}
          >
            <Icon name="map-marker-path" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Theo dõi đơn hàng</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'delivered' && (
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => handleAction('review')}
          >
            <Icon name="star" size={20} color="#ffffff" />
            <Text style={styles.reviewButtonText}>Đánh giá sản phẩm</Text>
          </TouchableOpacity>
        )}
        
        {(order.status === 'pending' || order.status === 'processing') && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleAction('cancel')}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderShipperOrderDetail = () => {
    // Handle both API format and mock format - improved customer data extraction
    const customer = order.user || order.customer || {};
    
    // Try multiple sources for customer information
    const customerName = customer.name || 
                        order.shippingAddress?.name || 
                        order.shippingAddress?.fullName || 
                        order.customerName ||
                        'Khách hàng';
    
    const customerPhone = customer.phone || 
                         order.shippingAddress?.phone || 
                         order.customerPhone ||
                         order.phone ||
                         'N/A';
    
    const customerEmail = customer.email || 
                         order.shippingAddress?.email || 
                         order.customerEmail ||
                         null;
    
    const customerAvatar = customer.avatar || 
                          customer.profileImage ||
                          'https://via.placeholder.com/50x50/e5e7eb/9ca3af?text=' + encodeURIComponent(customerName.charAt(0).toUpperCase());
    
    console.log('👤 Customer data extraction:');
    console.log('📝 Customer name:', customerName);
    console.log('📞 Customer phone:', customerPhone);
    console.log('📧 Customer email:', customerEmail);
    console.log('🖼️ Customer avatar:', customerAvatar);
    
    // Handle address formats - ensure proper formatting for geocoding
    const pickupAddress = order.pickupAddress || 'Store ABC, 456 Nguyen Hue St, District 1, Ho Chi Minh City';
    const deliveryAddress = order.address || 
      order.shippingAddress?.address ||
      (order.shippingAddress?.street && order.shippingAddress?.city ? 
        `${order.shippingAddress.street}, ${order.shippingAddress.city}` : null) ||
      'Địa chỉ giao hàng';
    
    console.log('🏠 Shipper OrderDetail - Address formatting:');
    console.log('📦 Pickup address:', pickupAddress);
    console.log('🎯 Delivery address:', deliveryAddress);
    
    // Handle price formats - ensure VND conversion with better detection
    let totalPrice = order.totalPrice || order.total || 0;
    let deliveryFee = order.deliveryFee || order.shippingFee || 0;
    
    // Convert USD to VND if prices seem to be in USD (less than 10000 suggests USD)
    // Most Vietnamese prices are at least 10,000 VND
    if (totalPrice > 0 && totalPrice < 10000) {
      console.log('💰 Converting total price from USD to VND:', totalPrice, '→', totalPrice * 24500);
      totalPrice = totalPrice * 24500; // Convert USD to VND
    }
    
    if (deliveryFee > 0 && deliveryFee < 1000) {
      console.log('💰 Converting delivery fee from USD to VND:', deliveryFee, '→', deliveryFee * 24500);
      deliveryFee = deliveryFee * 24500; // Convert USD to VND
    }
    
    console.log('💰 Final price handling:');
    console.log('💵 Total price (VND):', totalPrice);
    console.log('🚚 Delivery fee (VND):', deliveryFee);
    
    const distance = order.distance || '2.5 km';
    const estimatedTime = order.estimatedTime || '15 phút';

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => safeGoBack(navigation)}
          >
            <Icon name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn giao</Text>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => handleAction('call')}
          >
            <Icon name="phone" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Icon name={getStatusIcon(order.status)} size={20} color="#ffffff" />
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <View style={styles.infoRow}>
              <Icon name="road-variant" size={16} color="#6b7280" />
              <Text style={styles.infoText}>{distance} • {estimatedTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="currency-usd" size={16} color="#10b981" />
              <Text style={styles.infoText}>Phí giao: {formatVND(deliveryFee)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.customerCard}>
            <Image 
              source={{ uri: customerAvatar }} 
              style={styles.customerAvatar} 
              defaultSource={{ uri: 'https://via.placeholder.com/50x50/e5e7eb/9ca3af?text=?' }}
            />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
              {customerEmail && (
                <Text style={styles.customerEmail}>{customerEmail}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.callIconButton}
              onPress={() => handleAction('call')}
            >
              <Icon name="phone" size={20} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pickup & Delivery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Địa điểm</Text>
            <TouchableOpacity 
              style={styles.mapHeaderButton}
              onPress={() => navigation.navigate('Map', { 
                order: {
                  ...order,
                  pickupLocation: pickupAddress,
                  deliveryLocation: deliveryAddress
                }
              })}
            >
              <Icon name="map" size={16} color="#3b82f6" />
              <Text style={styles.mapButtonText}>Xem bản đồ</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <Icon name="store" size={16} color="#3b82f6" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Lấy hàng</Text>
                <Text style={styles.locationAddress}>{pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.locationDivider} />
            <View style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <Icon name="map-marker" size={16} color="#ef4444" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Giao hàng</Text>
                <Text style={styles.locationAddress}>{deliveryAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm ({(order.items || []).length})</Text>
          {(order.items && order.items.length > 0) ? (
            order.items.map((item, index) => (
              <View key={index} style={styles.shipperItemCard}>
                <View style={styles.shipperItemInfo}>
                  <Text style={styles.shipperItemName}>{item.name || 'Sản phẩm không tên'}</Text>
                  <Text style={styles.shipperItemPrice}>{formatVND(item.price || 0)}</Text>
                </View>
                <Text style={styles.shipperItemQuantity}>x{item.quantity || 1}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyItemsContainer}>
              <Icon name="package-variant" size={32} color="#cbd5e1" />
              <Text style={styles.emptyItemsText}>Không có thông tin sản phẩm</Text>
            </View>
          )}
          <View style={styles.orderTotal}>
            <Text style={styles.orderTotalLabel}>Tổng giá trị đơn hàng</Text>
            <Text style={styles.orderTotalValue}>{formatVND(totalPrice || 0)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          {order.status === 'confirmed' && (
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAction('accept')}
            >
              <Icon name="check" size={20} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Nhận đơn</Text>
            </TouchableOpacity>
          )}
          
          {order.status === 'shipped' && !deliveryStarted && (
            <TouchableOpacity 
              style={styles.shipButton}
              onPress={() => handleAction('ship')}
            >
              <Icon name="truck" size={20} color="#ffffff" />
              <Text style={styles.shipButtonText}>Bắt đầu giao</Text>
            </TouchableOpacity>
          )}
          
          {order.status === 'shipped' && deliveryStarted && (
            <>
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={() => navigation.navigate('Map', { 
                  order: {
                    ...order,
                    pickupLocation: pickupAddress,
                    deliveryLocation: deliveryAddress
                  }
                })}
              >
                <Icon name="navigation" size={20} color="#ffffff" />
                <Text style={styles.navigationButtonText}>Điều hướng</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => handleAction('complete')}
              >
                <Icon name="check-circle" size={20} color="#ffffff" />
                <Text style={styles.completeButtonText}>Hoàn thành</Text>
              </TouchableOpacity>
            </>
          )}
          
          {order.status === 'delivered' && (
            <View style={styles.completedIndicator}>
              <Icon name="check-circle" size={24} color="#10b981" />
              <Text style={styles.completedText}>Đơn hàng đã hoàn thành</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      {isShipper ? renderShipperOrderDetail() : renderUserOrderDetail()}
      
      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hủy đơn hàng</Text>
            <Text style={styles.modalSubtitle}>
              Bạn có chắc muốn hủy đơn hàng {order.orderNumber}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmCancel}
              >
                <Text style={styles.modalConfirmText}>Hủy đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  estimatedDelivery: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  deliveryDate: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  deliveryInfo: {
    marginTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mapButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  paymentCard: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  customerEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  callIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  shipperItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shipperItemInfo: {
    flex: 1,
  },
  shipperItemName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  shipperItemPrice: {
    fontSize: 12,
    color: '#6b7280',
  },
  shipperItemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyItemsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  actionSection: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  navigationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
  },
  shipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailScreen;