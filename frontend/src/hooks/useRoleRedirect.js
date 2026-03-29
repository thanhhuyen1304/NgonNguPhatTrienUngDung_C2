import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMe } from '../store/slices/authSlice';

const useRoleRedirect = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (initialized && isAuthenticated && user) {
      // Redirect based on role if user is on homepage or login page
      const isOnHomePage = location.pathname === '/';
      const isOnLoginPage = location.pathname === '/login';
      const isOnRegisterPage = location.pathname === '/register';
      
      if (isOnHomePage || isOnLoginPage || isOnRegisterPage) {
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'shipper') {
          navigate('/shipper');
        }
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
