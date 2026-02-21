import {
  Building2,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  LayoutGrid,
  Clock,
  Users,
  FolderKanban,
  LayoutPanelLeftIcon,
  ClipboardCheck,
  FileBarChart,
  Calculator,
  ArrowRightLeft,
  FileSpreadsheet,
  Timer,
  Layers
} from "lucide-react";
import { ROUTES } from './routes';

export const routeIcons = {
  [ROUTES.COMPANIES]: Building2,
  [ROUTES.USERS]: Users,
  [ROUTES.HOLIDAYS]: Calendar,
  [ROUTES.DASHBOARD]: LayoutDashboard,
  [ROUTES.TIMEOFF_PLAN]: CalendarDays,
  [ROUTES.PLANNING]: LayoutGrid,
  [ROUTES.TIMESHEET]: Clock,
  [ROUTES.CLIENTS]: Users,
  [ROUTES.PROJECTS]: FolderKanban,
  [ROUTES.ESTIMATOR]: Calculator,
  [ROUTES.CONVERT_ESTIMATE_TO_PROJECT]: ArrowRightLeft,
  [ROUTES.CAPACITY_PLAN]: Layers,
  [ROUTES.TEMPLATE_CONFIGURATION]: LayoutPanelLeftIcon,
  [ROUTES.TIMESHEET_SNAPSHOTS]: ClipboardCheck,
  [ROUTES.RECONCILIATION]: FileSpreadsheet,
  [ROUTES.TM_PLANNING]: Timer,
};

export const getRouteIcon = (path) => {
  return routeIcons[path] || null;
};

export const ReportIcon = FileBarChart;
