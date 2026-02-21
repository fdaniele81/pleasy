import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../features/login/api/authEndpoints';
import logger from '../utils/logger';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthLoading,
  selectAuthError,
} from '../store/selectors/authSelectors';
import { ROUTES, ROLES } from '../constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      logger.error('Logout error:', err);
      navigate(ROUTES.LOGIN);
    }
  };

  const hasRole = (role) => {
    return user?.role_id === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role_id);
  };

  const isAdmin = () => hasRole(ROLES.ADMIN);

  const isPM = () => hasRole(ROLES.PM);

  const isUser = () => hasRole(ROLES.USER);

  return {
    isAuthenticated,
    user,
    loading,
    error,

    handleLogout,
    hasRole,
    hasAnyRole,
    isAdmin,
    isPM,
    isUser,
  };
};
