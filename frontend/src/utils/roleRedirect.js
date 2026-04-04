export const isAdminUser = (user) => user?.role === 'admin';

export const getDefaultRouteForUser = (user) => {
  if (isAdminUser(user)) {
    return '/admin';
  }

  return '/';
};

export const getPostLoginRoute = (user, fromPath = '/') => {
  if (isAdminUser(user)) {
    return '/admin';
  }

  return fromPath || '/';
};
