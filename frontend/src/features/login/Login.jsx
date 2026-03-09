import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoginMutation, useImpersonateMutation } from './api/authEndpoints';
import { useLogoutMutation } from './api/authEndpoints';
import { apiSlice } from '../../api/apiSlice';
import logger from '../../utils/logger';
import { translateError } from '../../utils/translateError';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectMustChangePassword,
} from '../../store/slices/authSlice';
import { getDefaultRouteForRole } from '../../constants';
import ForceChangePasswordModal from './components/ForceChangePasswordModal';

const DEMO_USERS = {
  pm: { email: 'topolino.detopi@paperopoly.it', password: 'admin123' },
  user: { email: 'paperino.paperinik@paperopoly.it', password: 'admin123' },
};

function Login() {
  const { t } = useTranslation(['users', 'common']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const mustChangePassword = useSelector(selectMustChangePassword);
  const isDemoMode = searchParams.get('demo') === '1';

  const [login, { isLoading: loginLoading, error: loginError, reset: resetLogin }] = useLoginMutation();
  const [impersonateFn, { isLoading: impersonateLoading, error: impersonateError, reset: resetImpersonate }] = useImpersonateMutation();
  const [logout] = useLogoutMutation();

  const loading = loginLoading || impersonateLoading;
  const errorData = loginError?.data || impersonateError?.data;
  const error = errorData ? translateError(errorData) : null;

  const [impersonateMode, setImpersonateMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [impersonateData, setImpersonateData] = useState({
    adminEmail: '',
    adminPassword: '',
    targetEmail: '',
  });

  useEffect(() => {
    if (isAuthenticated && user && !mustChangePassword) {
      const defaultRoute = getDefaultRouteForRole(user.role_id);
      navigate(defaultRoute);
    }
  }, [isAuthenticated, user, mustChangePassword, navigate]);

  useEffect(() => {
    return () => {
      resetLogin();
      resetImpersonate();
    };
  }, [resetLogin, resetImpersonate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (impersonateMode) {
      setImpersonateData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetLogin();
    resetImpersonate();

    try {
      if (impersonateMode) {
        await impersonateFn(impersonateData).unwrap();
      } else {
        await login(formData).unwrap();
      }
      dispatch(apiSlice.util.resetApiState());
    } catch (err) {
      logger.error('Login failed:', err);
    }
  };

  const handleDemoLogin = async (role) => {
    resetLogin();
    resetImpersonate();
    const credentials = DEMO_USERS[role];
    setFormData(credentials);
    try {
      await login(credentials).unwrap();
      dispatch(apiSlice.util.resetApiState());
    } catch (err) {
      logger.error('Demo login failed:', err);
    }
  };

  const handleForcePasswordChanged = async () => {
    await logout();
    dispatch(apiSlice.util.resetApiState());
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <ForceChangePasswordModal
        isOpen={mustChangePassword}
        onPasswordChanged={handleForcePasswordChanged}
      />
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('common:login')}</h1>
          <button
            type="button"
            onClick={() => setImpersonateMode(!impersonateMode)}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              impersonateMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('users:impersonate')}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isDemoMode && !impersonateMode && (
          <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <p className="text-sm font-medium text-cyan-800 mb-3">
              {t('users:demoQuickAccess')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('pm')}
                className="flex-1 py-2 px-3 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {t('users:demoLoginPm')}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('user')}
                className="flex-1 py-2 px-3 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {t('users:demoLoginUser')}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {impersonateMode ? (
            <>
              <div className="mb-4">
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users:adminEmail')}
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={impersonateData.adminEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@system.local"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users:adminPassword')}
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={impersonateData.adminPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="********"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="targetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users:impersonateUser')}
                </label>
                <input
                  type="email"
                  id="targetEmail"
                  name="targetEmail"
                  value={impersonateData.targetEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t('users:impersonatePlaceholder')}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common:email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tua@email.com"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="********"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : impersonateMode
                  ? 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
                  : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? t('users:loggingIn') : impersonateMode ? t('users:impersonate') : t('users:signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
