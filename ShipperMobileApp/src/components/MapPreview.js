import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MapPreview = ({ order, onPress }) => {
  if (order.status !== 'in_progress') {
    return null;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.mapIcon}>
        <Icon name="map-marker-path" size={16} color="#8b5cf6" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Xem trên bản đồ</Text>
        <Text style={styles.subtitle}>Route giao hàng • {order.distance}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#6b7280" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  mapIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9d5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default MapPreview;