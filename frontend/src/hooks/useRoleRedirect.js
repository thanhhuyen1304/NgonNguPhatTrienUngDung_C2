import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMe } from '../store/slices/authSlice';
import { isAdminUser } from '../utils/roleRedirect';

const useRoleRedirect = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (initialized && isAuthenticated && user) {
      const isOnHomePage = location.pathname === '/';
      const isOnLoginPage = location.pathname === '/login';
      const isOnRegisterPage = location.pathname === '/register';
      const isOnAdminRoute = location.pathname.startsWith('/admin');
      
      if (isAdminUser(user) && !isOnAdminRoute && (isOnHomePage || isOnLoginPage || isOnRegisterPage)) {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, isAuthenticated, initialized, navigate, location.pathname]);

  // Listen for user role updates
  useEffect(() => {
    const handleUserRoleUpdate = async () => {
      if (initialized && isAuthenticated) {
        try {
          await dispatch(getMe()).unwrap();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    // Listen for custom events
    window.addEventListener('userDataChanged', handleUserRoleUpdate);
    window.addEventListener('userRoleUpdated', handleUserRoleUpdate);

    return () => {
      window.removeEventListener('userDataChanged', handleUserRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleUserRoleUpdate);
    };
  }, [dispatch, initialized, isAuthenticated]);

  // Function to refresh user data
  const refreshUserData = async () => {
    if (initialized && isAuthenticated) {
      try {
        await dispatch(getMe()).unwrap();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  return { refreshUserData };
};

export default useRoleRedirect;
