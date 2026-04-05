export const strongPasswordHint =
  'Mat khau phai co it nhat 8 ky tu, gom chu hoa, chu thuong, so, ky tu dac biet va khong co dau cach';

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,}$/;

export const createProfileFormData = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  street: user?.address?.street || '',
  city: user?.address?.city || '',
  country: user?.address?.country || 'Vietnam',
});

export const createEmptyPasswordData = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export const createAddressText = (address) => {
  const parts = [address?.street, address?.city, address?.country].filter(Boolean);
  return parts.join(', ');
};

export const buildProfileUpdatePayload = (formData) => ({
  name: formData.name,
  phone: formData.phone,
  address: {
    street: formData.street,
    city: formData.city,
    country: formData.country,
  },
});

export const buildProfileUpdateFormData = ({ formData, avatarFile }) => {
  const payload = new FormData();
  payload.append('name', formData.name);
  payload.append('phone', formData.phone);
  payload.append('street', formData.street);
  payload.append('city', formData.city);
  payload.append('country', formData.country);

  if (avatarFile) {
    payload.append('avatar', avatarFile);
  }

  return payload;
};

export const validatePasswordChange = (passwordData) => {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    return 'Mat khau xac nhan khong khop';
  }

  if (!strongPasswordRule.test(passwordData.newPassword)) {
    return strongPasswordHint;
  }

  return null;
};

export const buildAvatarFallbackUser = ({ currentUser, updatedUser, fallbackAvatar }) => ({
  ...(updatedUser || currentUser),
  avatar: fallbackAvatar,
});
