import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ShipperStatusScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const shipperInfo = user?.shipperInfo || {};

  const getStatusInfo = () => {
    switch (shipperInfo.status) {
      case 'pending':
        return {
          icon: 'clock-outline',
          color: '#f59e0b',
          title: 'Application Under Review',
          message: 'We are reviewing your delivery partner application. This usually takes 24-48 hours.',
        };
      case 'approved':
        return {
          icon: 'check-circle',
          color: '#10b981',
          title: 'Application Approved!',
          message: 'Congratulations! Your application has been approved. You can now start accepting delivery orders.',
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: '#ef4444',
          title: 'Application Not Approved',
          message: 'Unfortunately, your application was not approved at this time. You can reapply after 30 days.',
        };
      default:
        return {
          icon: 'information',
          color: '#6b7280',
          title: 'No Application Found',
          message: 'You have not submitted a delivery partner application yet.',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Partner Status</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
          <Icon name={statusInfo.icon} size={48} color={statusInfo.color} />
        </View>
        <Text style={styles.statusTitle}>{statusInfo.title}</Text>
        <Text style={styles.statusMessage}>{statusInfo.message}</Text>
      </View>

      {/* Application Details */}
      {shipperInfo.vehicleType && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Application Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailValue}>{shipperInfo.vehicleType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>License Plate:</Text>
            <Text style={styles.detailValue}>{shipperInfo.licensePlate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{shipperInfo.phone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Experience:</Text>
            <Text style={styles.detailValue}>{shipperInfo.experience || 0} years</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Working Hours:</Text>
            <Text style={styles.detailValue}>{shipperInfo.workingHours}</Text>
          </View>
          
          {shipperInfo.applicationDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Applied On:</Text>
              <Text style={styles.detailValue}>
                {new Date(shipperInfo.applicationDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {shipperInfo.status === 'rejected' && (
          <TouchableOpacity 
            style={styles.reapplyButton}
            onPress={() => navigation.navigate('ShipperRegistration')}
          >
            <Icon name="refresh" size={20} color="#ffffff" />
            <Text style={styles.reapplyButtonText}>Reapply</Text>
          </TouchableOpacity>
        )}
        
        {!shipperInfo.vehicleType && (
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => navigation.navigate('ShipperRegistration')}
          >
            <Icon name="plus" size={20} color="#ffffff" />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Help Section */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          If you have questions about your application or the delivery partner program, 
          please contact our support team.
        </Text>
        <TouchableOpacity style={styles.contactButton}>
          <Icon name="email" size={16} color="#3b82f6" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reapplyButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reapplyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ShipperStatusScreen;