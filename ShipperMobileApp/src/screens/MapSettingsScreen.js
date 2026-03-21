import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getMapPreference, 
  saveMapPreference, 
  clearMapPreference 
} from '../services/mapService';

const MapSettingsScreen = ({ navigation }) => {
  const [preference, setPreference] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const pref = await getMapPreference();
      setPreference(pref);
    } catch (error) {
      console.error('Error loading preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPreference = async (appType) => {
    try {
      await saveMapPreference(appType, true);
      await loadPreference();
      Alert.alert(
        'Đã lưu',
        `Sẽ luôn sử dụng ${appType === 'google' ? 'Google Maps' : 'Apple Maps'} để điều hướng`
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    }
  };

  const handleClearPreference = async () => {
    Alert.alert(
      'Xóa cài đặt',
      'Bạn có chắc muốn xóa cài đặt ứng dụng bản đồ mặc định?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearMapPreference();
              await loadPreference();
              Alert.alert('Đã xóa', 'Sẽ hỏi lại khi điều hướng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa cài đặt');
            }
          }
        }
      ]
    );
  };

  const getPreferenceText = () => {
    if (!preference || !preference.alwaysUse) {
      return 'Hỏi mỗi lần';
    }
    return preference.appType === 'google' ? 'Google Maps' : 'Apple Maps';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Cài đặt bản đồ</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Current Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng bản đồ mặc định</Text>
          <View style={styles.currentSetting}>
            <Icon name="map" size={24} color="#3b82f6" />
            <View style={styles.currentSettingText}>
              <Text style={styles.currentSettingTitle}>Hiện tại</Text>
              <Text style={styles.currentSettingValue}>{getPreferenceText()}</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ứng dụng mặc định</Text>
          
          {/* Google Maps */}
          <TouchableOpacity 
            style={[
              styles.optionItem,
              preference?.appType === 'google' && preference?.alwaysUse && styles.selectedOption
            ]}
            onPress={() => handleSetPreference('google')}
          >
            <Icon name="google-maps" size={24} color="#4285f4" />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Google Maps</Text>
              <Text style={styles.optionSubtitle}>Điều hướng với Google Maps</Text>
            </View>
            {preference?.appType === 'google' && preference?.alwaysUse && (
              <Icon name="check-circle" size={20} color="#10b981" />
            )}
          </TouchableOpacity>

          {/* Apple Maps (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[
                styles.optionItem,
                preference?.appType === 'apple' && preference?.alwaysUse && styles.selectedOption
              ]}
              onPress={() => handleSetPreference('apple')}
            >
              <Icon name="apple" size={24} color="#000000" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Apple Maps</Text>
                <Text style={styles.optionSubtitle}>Điều hướng với Apple Maps</Text>
              </View>
              {preference?.appType === 'apple' && preference?.alwaysUse && (
                <Icon name="check-circle" size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          )}

          {/* Ask Every Time */}
          <TouchableOpacity 
            style={[
              styles.optionItem,
              (!preference || !preference.alwaysUse) && styles.selectedOption
            ]}
            onPress={handleClearPreference}
          >
            <Icon name="help-circle-outline" size={24} color="#6b7280" />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Hỏi mỗi lần</Text>
              <Text style={styles.optionSubtitle}>Chọn ứng dụng khi cần điều hướng</Text>
            </View>
            {(!preference || !preference.alwaysUse) && (
              <Icon name="check-circle" size={20} color="#10b981" />
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Icon name="information-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            Bạn có thể thay đổi cài đặt này bất cứ lúc nào. Nếu chọn "Hỏi mỗi lần", 
            app sẽ hiển thị dialog để chọn ứng dụng bản đồ.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  currentSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentSettingText: {
    flex: 1,
  },
  currentSettingTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  currentSettingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 'auto',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
  },
});

export default MapSettingsScreen;