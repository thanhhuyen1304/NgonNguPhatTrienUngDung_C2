import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../store/slices/authSlice';

const Header = ({ title, showBack = false, showProfile = true, showCart = true }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart || { items: [] });
  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistItemsCount = wishlistItems ? wishlistItems.length : 0;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            setShowUserMenu(false);
          },
        },
      ]
    );
  };

  const UserMenu = () => (
    <Modal
      visible={showUserMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUserMenu(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowUserMenu(false)}
      >
        <View style={styles.userMenuContainer}>
          <View style={styles.userMenuHeader}>
            <View style={styles.userInfo}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="account" size={24} color="#6b7280" />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.userMenuItems}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                navigation.navigate('Profile');
              }}
            >
              <Icon name="account-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                navigation.navigate('Orders');
              }}
            >
              <Icon name="package-multiple-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                Alert.alert('Thông báo', 'Chức năng wishlist không khả dụng cho shipper');
              }}
            >
              <Icon name="heart-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>Wishlist</Text>
            </TouchableOpacity>

            {user?.role === 'admin' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowUserMenu(false);
                  navigation.navigate('Admin');
                }}
              >
                <Icon name="shield-crown-outline" size={20} color="#374151" />
                <Text style={styles.menuItemText}>Admin Panel</Text>
              </TouchableOpacity>
            )}

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                navigation.navigate('Settings');
              }}
            >
              <Icon name="cog-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Icon name="logout" size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <View style={styles.logo}>
                <Icon name="shopping" size={24} color="#3b82f6" />
                <Text style={styles.logoText}>E-commerce</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {/* Search Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="magnify" size={24} color="#6b7280" />
          </TouchableOpacity>

          {/* Wishlist */}
          {showCart && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => Alert.alert('Thông báo', 'Chức năng wishlist không khả dụng cho shipper')}
            >
              <Icon name="heart-outline" size={24} color="#6b7280" />
              {wishlistItemsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Cart */}
          {showCart && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => Alert.alert('Thông báo', 'Chức năng giỏ hàng không khả dụng cho shipper')}
            >
              <Icon name="shopping-outline" size={24} color="#6b7280" />
              {cartItemsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* User Profile */}
          {showProfile && isAuthenticated ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowUserMenu(true)}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Icon name="account" size={20} color="#6b7280" />
                </View>
              )}
            </TouchableOpacity>
          ) : showProfile && !isAuthenticated ? (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <UserMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 4,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    marginLeft: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  userMenuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userMenuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  userMenuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
  },
});

export default Header;