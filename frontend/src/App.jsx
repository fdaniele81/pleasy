import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { localLogout } from "./store/slices/authSlice";
import Header from "./shared/components/Header";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import FeatureErrorBoundary from "./shared/components/FeatureErrorBoundary";
import ToastContainer from "./shared/ui/ToastContainer";
import { ROUTES, ROLE_GROUPS, getDefaultRouteForRole } from "./constants";

const Login = lazy(() => import("./features/login/Login"));
const Companies = lazy(() => import("./features/companies/Companies"));
const Users = lazy(() => import("./features/users/Users"));
const Timesheet = lazy(() => import("./features/timesheet/Timesheet"));
const Holidays = lazy(() => import("./features/holidays/Holidays"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const Clients = lazy(() => import("./features/clients/Clients"));
const Projects = lazy(() => import("./features/projects/Projects"));
const Planning = lazy(() => import("./features/planning/Planning"));
const TimeOffPlan = lazy(() => import("./features/timeoffplan/TimeOffPlan"));
const TemplateConfiguration = lazy(() => import("./features/templateconfiguration/TemplateConfiguration"));
const TimesheetSnapshots = lazy(() => import("./features/timesheetsnapshots/TimesheetSnapshots"));
const Estimator = lazy(() => import("./features/estimator/Estimator"));
const EstimateEditorInfo = lazy(() => import("./features/estimator/EstimateEditorInfo"));
const EstimateEditorTasks = lazy(() => import("./features/estimator/EstimateEditorTasks"));
const ConvertEstimateToProject = lazy(() => import("./features/estimator/ConvertEstimateToProject"));
const Reconciliation = lazy(() => import("./features/reconciliation/Reconciliation"));
const TMPlanning = lazy(() => import("./features/tmplanning/TMPlanning"));
const CapacityPlan = lazy(() => import("./features/capacity-plan/CapacityPlan"));
const CapacityPlanView = lazy(() => import("./features/capacity-plan/CapacityPlanView"));

const PageLoader = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">{t('loading')}</div>
    </div>
  );
};

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role_id)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(localLogout());
      navigate("/login", { replace: true });
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [dispatch, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {t('desktopRequired')}
          </h2>
          <p className="text-gray-600">
            {t('desktopRequiredMessage')}
          </p>
        </div>
      </div>
    );
  }

  const HomeRedirect = () => {
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    const defaultRoute = getDefaultRouteForRole(user?.role_id);
    return <Navigate to={defaultRoute} replace />;
  };

  return (
    <ErrorBoundary>
      <ToastContainer />
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomeRedirect />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />

          <Route
            path={ROUTES.COMPANIES}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
                <Companies />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.USERS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_AND_PM}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="Dashboard">
                  <Dashboard />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CLIENTS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <Clients />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PROJECTS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <Projects />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PLANNING}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="Planning">
                  <Planning />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TM_PLANNING}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="T&M Planning">
                  <TMPlanning />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ESTIMATOR}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <Estimator />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CONVERT_ESTIMATE_TO_PROJECT}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <ConvertEstimateToProject />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CAPACITY_PLAN}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <CapacityPlan />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CAPACITY_PLAN_VIEW}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="Capacity Plan">
                  <CapacityPlanView />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ESTIMATE_EDITOR_INFO}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <EstimateEditorInfo />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ESTIMATE_EDITOR_TASKS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="Editor Task Stima">
                  <EstimateEditorTasks />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TIMESHEET}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_AND_USER}>
                <FeatureErrorBoundary featureName="Consuntivo">
                  <Timesheet />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.HOLIDAYS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_AND_PM}>
                <Holidays />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TIMEOFF_PLAN}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_AND_PM}>
                <TimeOffPlan />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TEMPLATE_CONFIGURATION}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <TemplateConfiguration />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TIMESHEET_SNAPSHOTS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <TimesheetSnapshots />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.RECONCILIATION}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <FeatureErrorBoundary featureName="Quadratura Consuntivi">
                  <Reconciliation />
                </FeatureErrorBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
