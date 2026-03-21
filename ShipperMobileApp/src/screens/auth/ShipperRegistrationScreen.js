import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const ShipperRegistrationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    vehicleType: '',
    licensePlate: '',
    phone: '',
    experience: '',
    workingHours: 'full-time',
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useSelector((state) => state.auth);

  const vehicleTypes = [
    { key: 'motorcycle', label: 'Xe máy', icon: 'motorbike', color: '#3b82f6' },
    { key: 'bicycle', label: 'Xe đạp', icon: 'bicycle', color: '#10b981' },
    { key: 'car', label: 'Ô tô', icon: 'car', color: '#f59e0b' },
    { key: 'truck', label: 'Xe tải', icon: 'truck', color: '#8b5cf6' },
  ];

  const workingHoursOptions = [
    { 
      key: 'full-time', 
      label: 'Toàn thời gian', 
      subtitle: '8+ giờ/ngày',
      icon: 'clock-time-eight'
    },
    { 
      key: 'part-time', 
      label: 'Bán thời gian', 
      subtitle: '4-8 giờ/ngày',
      icon: 'clock-time-four'
    },
    { 
      key: 'flexible', 
      label: 'Linh hoạt', 
      subtitle: 'Tự do thời gian',
      icon: 'clock-outline'
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.vehicleType || !formData.licensePlate || !formData.phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }

    setLoading(true);
    
    try {
      // Call API to submit shipper application
      const response = await fetch('http://10.15.3.62:5000/api/auth/apply-shipper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Đăng ký thành công!',
          'Đơn đăng ký của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
          [
            {
              text: 'Đồng ý',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi đơn đăng ký');
      }
    } catch (error) {
      console.error('Shipper application error:', error);
      Alert.alert('Lỗi', 'Không thể gửi đơn đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Trở thành đối tác</Text>
          <Text style={styles.subtitle}>Đăng ký giao hàng cùng chúng tôi</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.userAvatar}>
            <Icon name="account" size={32} color="#3b82f6" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Icon name="check-circle" size={20} color="#10b981" />
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Bước 1/1: Thông tin cơ bản</Text>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="motorbike" size={20} color="#3b82f6" /> Phương tiện vận chuyển
          </Text>
          <Text style={styles.sectionSubtitle}>Chọn loại phương tiện bạn sử dụng *</Text>
          
          <View style={styles.vehicleGrid}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.key}
                style={[
                  styles.vehicleCard,
                  formData.vehicleType === vehicle.key && styles.vehicleCardSelected
                ]}
                onPress={() => handleInputChange('vehicleType', vehicle.key)}
              >
                <View style={[
                  styles.vehicleIconContainer,
                  { backgroundColor: formData.vehicleType === vehicle.key ? vehicle.color : '#f3f4f6' }
                ]}>
                  <Icon 
                    name={vehicle.icon} 
                    size={28} 
                    color={formData.vehicleType === vehicle.key ? '#ffffff' : '#6b7280'} 
                  />
                </View>
                <Text style={[
                  styles.vehicleLabel,
                  formData.vehicleType === vehicle.key && styles.vehicleLabelSelected
                ]}>
                  {vehicle.label}
                </Text>
                {formData.vehicleType === vehicle.key && (
                  <View style={styles.selectedIndicator}>
                    <Icon name="check" size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="card-account-details" size={20} color="#3b82f6" /> Thông tin cá nhân
          </Text>
          
          {/* License Plate */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Biển số xe *</Text>
            <View style={styles.inputContainer}>
              <Icon name="card-text-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 29A1-12345"
                value={formData.licensePlate}
                onChangeText={(value) => handleInputChange('licensePlate', value.toUpperCase())}
                autoCapitalize="characters"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại của bạn"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
                maxLength={11}
              />
            </View>
          </View>

          {/* Experience */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kinh nghiệm giao hàng (Tùy chọn)</Text>
            <View style={styles.inputContainer}>
              <Icon name="briefcase-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Số năm kinh nghiệm"
                value={formData.experience}
                onChangeText={(value) => handleInputChange('experience', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="clock-outline" size={20} color="#3b82f6" /> Thời gian làm việc
          </Text>
          <Text style={styles.sectionSubtitle}>Chọn khung giờ phù hợp với bạn</Text>
          
          <View style={styles.workingHoursContainer}>
            {workingHoursOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.workingHourCard,
                  formData.workingHours === option.key && styles.workingHourCardSelected
                ]}
                onPress={() => handleInputChange('workingHours', option.key)}
              >
                <View style={styles.workingHourLeft}>
                  <Icon 
                    name={option.icon} 
                    size={24} 
                    color={formData.workingHours === option.key ? '#3b82f6' : '#6b7280'} 
                  />
                  <View style={styles.workingHourInfo}>
                    <Text style={[
                      styles.workingHourLabel,
                      formData.workingHours === option.key && styles.workingHourLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.workingHourSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
                <Icon 
                  name={formData.workingHours === option.key ? 'radiobox-marked' : 'radiobox-blank'} 
                  size={24} 
                  color="#3b82f6" 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="gift" size={20} color="#10b981" /> Quyền lợi đối tác
          </Text>
          
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <Icon name="cash-multiple" size={24} color="#10b981" />
              <Text style={styles.benefitTitle}>Thu nhập hấp dẫn</Text>
              <Text style={styles.benefitDesc}>15,000 - 25,000 VNĐ/đơn</Text>
            </View>
            
            <View style={styles.benefitCard}>
              <Icon name="clock-fast" size={24} color="#f59e0b" />
              <Text style={styles.benefitTitle}>Linh hoạt thời gian</Text>
              <Text style={styles.benefitDesc}>Tự do sắp xếp</Text>
            </View>
            
            <View style={styles.benefitCard}>
              <Icon name="shield-check" size={24} color="#3b82f6" />
              <Text style={styles.benefitTitle}>Bảo hiểm</Text>
              <Text style={styles.benefitDesc}>Hỗ trợ tai nạn</Text>
            </View>
            
            <View style={styles.benefitCard}>
              <Icon name="account-group" size={24} color="#8b5cf6" />
              <Text style={styles.benefitTitle}>Cộng đồng</Text>
              <Text style={styles.benefitDesc}>Hỗ trợ 24/7</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon name="loading" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Đang gửi...</Text>
            </>
          ) : (
            <>
              <Icon name="send" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Gửi đơn đăng ký</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Icon name="information-outline" size={16} color="#6b7280" />
          <Text style={styles.termsText}>
            Bằng việc gửi đơn đăng ký, bạn đồng ý với{' '}
            <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> và{' '}
            <Text style={styles.termsLink}>Chính sách bảo mật</Text> của chúng tôi.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginTop: -12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleCard: {
    width: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  vehicleLabelSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  workingHoursContainer: {
    gap: 12,
  },
  workingHourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  workingHourCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  workingHourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workingHourInfo: {
    marginLeft: 12,
    flex: 1,
  },
  workingHourLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  workingHourLabelSelected: {
    color: '#3b82f6',
  },
  workingHourSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ShipperRegistrationScreen;