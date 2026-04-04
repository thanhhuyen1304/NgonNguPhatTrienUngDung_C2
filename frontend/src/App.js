import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, clearSessionState, hasStoredSessionHint } from './store/slices/authSlice';
import socketService from './services/socketService';
import { getCart } from './store/slices/cartSlice';
import { getWishlist } from './store/slices/wishlistSlice';
import useRoleRedirect from './hooks/useRoleRedirect';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GoogleCallback from './pages/GoogleCallback';
import ContactPage from './pages/ContactPage';

// Protected Pages
import CheckoutPage from './pages/CheckoutPage';
import PaymentResultPage from './pages/PaymentResultPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminSupportInbox from './pages/admin/SupportInbox';

// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import AdminRoute from './components/guards/AdminRoute';
import GuestRoute from './components/guards/GuestRoute';

// Common Components
import RoleChangeNotification from './components/common/RoleChangeNotification';

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  
  // Use role redirect hook
  useRoleRedirect();

  useEffect(() => {
    const isGoogleCallbackRoute = location.pathname === '/auth/google/callback';

    if (!isGoogleCallbackRoute && hasStoredSessionHint()) {
      dispatch(bootstrapAuth());
      return;
    }

    if (!isGoogleCallbackRoute) {
      dispatch(clearSessionState());
    }
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (isAuthenticated) {
      socketService.connect();
      return;
    }

    socketService.disconnect();
  }, [initialized, isAuthenticated]);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      dispatch(getCart());
      dispatch(getWishlist());
    }
  }, [dispatch, initialized, isAuthenticated]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Guest Only Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<AdminSupportInbox />} />
          </Route>
        </Route>
      </Routes>
      
      {/* Role Change Notification */}
      <RoleChangeNotification />
    </>
  );
}

export default App;
