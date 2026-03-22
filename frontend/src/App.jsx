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
const ConvertEstimateToProject = lazy(() => import("./features/estimate-conversion/ConvertEstimateToProject"));
const Reconciliation = lazy(() => import("./features/reconciliation/Reconciliation"));
const MySubmissions = lazy(() => import("./features/mysubmissions/MySubmissions"));
const TMPlanning = lazy(() => import("./features/tmplanning/TMPlanning"));
const CapacityPlan = lazy(() => import("./features/capacity-plan/CapacityPlan"));
const CapacityPlanView = lazy(() => import("./features/capacity-plan/CapacityPlanView"));
const DefaultConfig = lazy(() => import("./features/default-config/DefaultConfig"));

const PageLoader = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">{t('loading')}</div>
    </div>
  );
};

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, mustChangePassword } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role_id)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { user, isAuthenticated, mustChangePassword } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(localLogout());
      navigate("/login", { replace: true });
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [dispatch, navigate]);

  const HomeRedirect = () => {
    if (!isAuthenticated || mustChangePassword) {
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
            path={ROUTES.MY_SUBMISSIONS}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_AND_USER}>
                <FeatureErrorBoundary featureName="I Miei Consuntivi">
                  <MySubmissions />
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
            path={ROUTES.DEFAULT_CONFIG}
            element={
              <ProtectedRoute allowedRoles={ROLE_GROUPS.PM_ONLY}>
                <DefaultConfig />
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
