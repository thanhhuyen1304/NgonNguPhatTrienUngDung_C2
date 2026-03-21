import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, changePassword, setCredentials, getMe } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { UserCircleIcon, CameraIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(false);
  const [changePassMode, setChangePassMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'Vietnam',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [shipperApplication, setShipperApplication] = useState({
    vehicleType: '',
    licensePlate: '',
    drivingLicense: '',
    experience: '',
  });

  const [showShipperForm, setShowShipperForm] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show immediate local preview
    try {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Auto upload avatar immediately
      const formDataWithAvatar = new FormData();
      formDataWithAvatar.append('avatar', file);

      const updatedUser = await dispatch(updateProfile(formDataWithAvatar)).unwrap();
      console.log('updateProfile response:', updatedUser);
      toast.success('Avatar updated');

      // Update redux auth state so Header reflects new avatar immediately
      if (updatedUser) {
        // refresh server data to ensure avatar URL is correct
        try {
          const me = await dispatch(getMe()).unwrap();
          console.log('getMe response:', me);
        } catch (err) {
          // fallback to returned payload
          console.warn('getMe failed, falling back to returned payload', err);
          dispatch(setCredentials(updatedUser));
        }
        // debug current localStorage
        try {
          console.log('localStorage.user after upload:', localStorage.getItem('user'));
        } catch (e) {
          // ignore
        }
        // Use returned avatar as preview if available
        if (updatedUser.avatar) {
          setAvatarPreview(updatedUser.avatar);
        } else {
          // Backend did not return avatar (e.g., Cloudinary not configured) — use local preview as fallback
          const fallbackUrl = previewUrl || avatarPreview;
          if (fallbackUrl) {
            // Update redux and localStorage so header shows the preview immediately
            try {
              const newUser = { ...(updatedUser || user), avatar: fallbackUrl };
              dispatch(setCredentials(newUser));
              localStorage.setItem('user', JSON.stringify(newUser));
              setAvatarPreview(fallbackUrl);
            } catch (e) {
              console.warn('Failed to set fallback avatar in redux/localStorage', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error(error || 'Failed to upload avatar');
    } finally {
      setAvatarFile(null);
      // reset input value to allow re-uploading same file if needed
      e.target.value = null;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleShipperApplicationChange = (e) => {
    setShipperApplication({ ...shipperApplication, [e.target.name]: e.target.value });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      };

      if (avatarFile) {
        // Convert file to base64 or send as FormData
        const formDataWithAvatar = new FormData();
        formDataWithAvatar.append('name', formData.name);
        formDataWithAvatar.append('phone', formData.phone);
        formDataWithAvatar.append('street', formData.street);
        formDataWithAvatar.append('city', formData.city);
        formDataWithAvatar.append('state', formData.state);
        formDataWithAvatar.append('zipCode', formData.zipCode);
        formDataWithAvatar.append('country', formData.country);
        formDataWithAvatar.append('avatar', avatarFile);
        
        await dispatch(updateProfile(formDataWithAvatar)).unwrap();
      } else {
        await dispatch(updateProfile(updateData)).unwrap();
      }
      
      toast.success('Hồ sơ đã được cập nhật');
      setEditMode(false);
      setAvatarFile(null);
    } catch (error) {
      toast.error(error || 'Lỗi cập nhật hồ sơ');
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();

      toast.success('Mật khẩu đã được thay đổi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setChangePassMode(false);
    } catch (error) {
      toast.error(error || 'Lỗi thay đổi mật khẩu');
    }
  };

  const handleSubmitShipperApplication = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/users/shipper-applications', shipperApplication);
      toast.success('Đơn đăng ký đã được gửi thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
      setShowShipperForm(false);
      setShipperApplication({
        vehicleType: '',
        licensePlate: '',
        drivingLicense: '',
        experience: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn đăng ký');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ của tôi</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và địa chỉ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 text-center sticky top-20">
              <div className="mb-4 relative inline-block group">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt={user?.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover"
                />
              ) : user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover"
                />
              ) : (
                <UserCircleIcon className="w-24 h-24 mx-auto text-gray-400" />
              )}
              {/* Camera Icon - Always Visible */}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer shadow-lg transition-opacity opacity-100">
                <CameraIcon className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{user?.email}</p>
            <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {user?.role === 'admin' ? 'Quản trị viên' : 
               user?.role === 'shipper' ? 'Đối tác giao hàng' : 'Khách hàng'}
            </div>
            {user?.isEmailVerified && (
              <div className="mt-3 text-green-600 text-sm flex items-center justify-center">
                <span className="mr-1">✓</span> Email đã xác minh
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h3>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  if (!editMode) {
                    setFormData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      street: user?.address?.street || '',
                      city: user?.address?.city || '',
                      state: user?.address?.state || '',
                      zipCode: user?.address?.zipCode || '',
                      country: user?.address?.country || 'Vietnam',
                    });
                  } else {
                    setAvatarFile(null);
                    setAvatarPreview(user?.avatar || null);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                {editMode ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmitProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Địa chỉ</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đường
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thành phố
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tỉnh
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã bưu điện
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quốc gia
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="text-sm text-gray-600">Họ và tên</p>
                  <p className="font-semibold">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-semibold">{user?.phone || 'Chưa cập nhật'}</p>
                </div>
                {user?.address && (
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ</p>
                    <p className="font-semibold">
                      {user.getFullAddress?.() || 'Chưa cập nhật'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change Password */}
          {!user?.googleId && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Bảo mật</h3>
                <button
                  onClick={() => {
                    setChangePassMode(!changePassMode);
                    if (!changePassMode) {
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  {changePassMode ? 'Hủy' : 'Thay đổi mật khẩu'}
                </button>
              </div>

              {changePassMode ? (
                <form onSubmit={handleSubmitPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu hiện tại *
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới *
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400"
                  >
                    {loading ? 'Đang cập nhật...' : 'Thay đổi mật khẩu'}
                  </button>
                </form>
              ) : (
                <p className="text-gray-700">
                  Để bảo vệ tài khoản của bạn, hãy sử dụng mật khẩu mạnh và duy nhất.
                </p>
              )}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <p className="text-sm text-gray-600">Loại tài khoản</p>
                <p className="font-semibold">
                  {user?.role === 'admin' ? 'Quản trị viên' : 
                   user?.role === 'shipper' ? 'Đối tác giao hàng' : 'Khách hàng'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-semibold">
                  {new Date(user?.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <p className="font-semibold">
                  {user?.isActive ? (
                    <span className="text-green-600">Hoạt động</span>
                  ) : (
                    <span className="text-red-600">Vô hiệu hóa</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Shipper Application */}
          {user?.role === 'user' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <TruckIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Trở thành đối tác giao hàng
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Đăng ký để trở thành shipper và bắt đầu kiếm thu nhập
                  </p>
                </div>
                <button
                  onClick={() => setShowShipperForm(!showShipperForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                >
                  {showShipperForm ? 'Hủy' : 'Đăng ký ngay'}
                </button>
              </div>

              {showShipperForm ? (
                <form onSubmit={handleSubmitShipperApplication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại phương tiện *
                    </label>
                    <select
                      name="vehicleType"
                      value={shipperApplication.vehicleType}
                      onChange={handleShipperApplicationChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn loại phương tiện</option>
                      <option value="motorbike">Xe máy</option>
                      <option value="car">Ô tô</option>
                      <option value="truck">Xe tải nhỏ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Biển số xe *
                    </label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={shipperApplication.licensePlate}
                      onChange={handleShipperApplicationChange}
                      required
                      placeholder="VD: 30A-12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số giấy phép lái xe *
                    </label>
                    <input
                      type="text"
                      name="drivingLicense"
                      value={shipperApplication.drivingLicense}
                      onChange={handleShipperApplicationChange}
                      required
                      placeholder="Nhập số giấy phép lái xe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số năm kinh nghiệm giao hàng
                    </label>
                    <select
                      name="experience"
                      value={shipperApplication.experience}
                      onChange={handleShipperApplicationChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn số năm kinh nghiệm</option>
                      <option value="0">Chưa có kinh nghiệm</option>
                      <option value="1">1 năm</option>
                      <option value="2">2 năm</option>
                      <option value="3">3 năm</option>
                      <option value="4">4 năm</option>
                      <option value="5">5+ năm</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Lợi ích khi trở thành đối tác:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Thu nhập linh hoạt theo thời gian làm việc</li>
                      <li>• Nhận đơn hàng phù hợp với khu vực của bạn</li>
                      <li>• Hỗ trợ 24/7 từ đội ngũ chăm sóc khách hàng</li>
                      <li>• Thanh toán nhanh chóng và minh bạch</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <TruckIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Bạn muốn kiếm thêm thu nhập bằng cách giao hàng?
                  </p>
                  <p className="text-sm text-gray-500">
                    Đăng ký trở thành đối tác giao hàng để bắt đầu nhận đơn hàng trong khu vực của bạn.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
