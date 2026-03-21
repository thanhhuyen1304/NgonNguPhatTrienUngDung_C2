import api from './api';

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error.response?.data || error;
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data.data.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error.response?.data || error;
  }
};

// Upload avatar
export const uploadAvatar = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });

    const response = await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.user;
  } catch (error) {
    console.error('Upload avatar error:', error);
    throw error.response?.data || error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error.response?.data || error;
  }
};

export default {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};