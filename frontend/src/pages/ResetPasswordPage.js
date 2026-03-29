import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, resetPassword } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,}$/;
const strongPasswordHint = 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không có dấu cách';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const passwordMismatch = useMemo(() => {
    return Boolean(formData.confirmPassword && formData.newPassword !== formData.confirmPassword);
  }, [formData.confirmPassword, formData.newPassword]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Liên kết đặt lại mật khẩu không hợp lệ');
      return;
    }

    if (passwordMismatch) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!strongPasswordRule.test(formData.newPassword)) {
      toast.error(strongPasswordHint);
      return;
    }

    try {
      const user = await dispatch(resetPassword({ token, newPassword: formData.newPassword })).unwrap();
      toast.success('Đặt lại mật khẩu thành công');

      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'shipper') {
        navigate('/shipper', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (submitError) {
      return submitError;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-600 mt-2">
            Tạo mật khẩu mới để tiếp tục sử dụng tài khoản của bạn.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="input"
                placeholder="Nhập mật khẩu mới"
              />
              <p className="mt-2 text-xs text-gray-500">
                Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không có dấu cách.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input"
                placeholder="Nhập lại mật khẩu mới"
              />
              {passwordMismatch && (
                <p className="mt-2 text-sm text-red-600">Mật khẩu xác nhận không khớp.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Liên kết hết hạn hoặc không hợp lệ?{' '}
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Yêu cầu liên kết mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
