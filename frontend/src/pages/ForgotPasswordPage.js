import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, clearForgotPasswordState, forgotPassword } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const {
    loading,
    error,
    forgotPasswordStatus,
    forgotPasswordPreviewUrl,
    forgotPasswordMessage,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearForgotPasswordState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(forgotPassword(email)).unwrap();
    } catch (submitError) {
      return submitError;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-gray-600 mt-2">
            Nhập email của bạn để tạo liên kết đặt lại mật khẩu.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="Nhập email đã đăng ký"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Gửi yêu cầu đặt lại mật khẩu'}
            </button>
          </form>

          {forgotPasswordStatus === 'success' && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
              <p className="text-sm text-green-800">
                {forgotPasswordMessage || 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã sẵn sàng.'}
              </p>

              {forgotPasswordPreviewUrl && (
                <div className="rounded-lg bg-white border border-green-100 p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Liên kết demo để đặt lại mật khẩu
                  </p>
                  <a
                    href={forgotPasswordPreviewUrl}
                    className="break-all text-sm text-blue-600 hover:text-blue-700"
                  >
                    {forgotPasswordPreviewUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-600">
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
