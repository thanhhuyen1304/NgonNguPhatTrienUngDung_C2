import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { bootstrapAuth } from '../store/slices/authSlice';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasExecuted = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed');
      navigate('/login');
      return;
    }

    if (status === 'success') {
      const handleCallback = async () => {
        try {
          const result = await dispatch(bootstrapAuth()).unwrap();
          toast.success('Login successful!');
          
          // Role-based redirection
          if (result.role === 'admin') {
            navigate('/admin');
          } else if (result.role === 'shipper') {
            navigate('/shipper');
          } else {
            navigate('/');
          }
        } catch (err) {
          toast.error(err || 'Authentication failed');
          navigate('/login');
        }
      };
      handleCallback();
      return;
    }

    navigate('/login');
  }, [searchParams, dispatch, navigate]);

  return <Loading fullScreen />;
};

export default GoogleCallback;
