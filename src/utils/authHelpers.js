export const getUserRoleRedirect = (role) => {
  switch (role) {
    case 'Superadmin':
      return '/dashboard';
    
    default:
      return '/login';
  }
};
