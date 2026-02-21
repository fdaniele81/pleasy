import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Shared translations
import commonIt from '@/shared/translations/it/common.json';
import navigationIt from '@/shared/translations/it/navigation.json';
import validationIt from '@/shared/translations/it/validation.json';
import errorsIt from '@/shared/translations/it/errors.json';

import commonEn from '@/shared/translations/en/common.json';
import navigationEn from '@/shared/translations/en/navigation.json';
import validationEn from '@/shared/translations/en/validation.json';
import errorsEn from '@/shared/translations/en/errors.json';

// Feature translations - IT
import holidaysIt from '@/features/holidays/translations/it.json';
import clientsIt from '@/features/clients/translations/it.json';
import companiesIt from '@/features/companies/translations/it.json';
import usersIt from '@/features/users/translations/it.json';
import projectsIt from '@/features/projects/translations/it.json';
import planningIt from '@/features/planning/translations/it.json';
import timesheetIt from '@/features/timesheet/translations/it.json';
import estimatorIt from '@/features/estimator/translations/it.json';
import reconciliationIt from '@/features/reconciliation/translations/it.json';
import templateconfigIt from '@/features/templateconfiguration/translations/it.json';
import tmplanningIt from '@/features/tmplanning/translations/it.json';
import capacityPlanIt from '@/features/capacity-plan/translations/it.json';
import dashboardIt from '@/features/dashboard/translations/it.json';
import timesheetsnapshotsIt from '@/features/timesheetsnapshots/translations/it.json';
import timeoffplanIt from '@/features/timeoffplan/translations/it.json';

// Feature translations - EN
import holidaysEn from '@/features/holidays/translations/en.json';
import clientsEn from '@/features/clients/translations/en.json';
import companiesEn from '@/features/companies/translations/en.json';
import usersEn from '@/features/users/translations/en.json';
import projectsEn from '@/features/projects/translations/en.json';
import planningEn from '@/features/planning/translations/en.json';
import timesheetEn from '@/features/timesheet/translations/en.json';
import estimatorEn from '@/features/estimator/translations/en.json';
import reconciliationEn from '@/features/reconciliation/translations/en.json';
import templateconfigEn from '@/features/templateconfiguration/translations/en.json';
import tmplanningEn from '@/features/tmplanning/translations/en.json';
import capacityPlanEn from '@/features/capacity-plan/translations/en.json';
import dashboardEn from '@/features/dashboard/translations/en.json';
import timesheetsnapshotsEn from '@/features/timesheetsnapshots/translations/en.json';
import timeoffplanEn from '@/features/timeoffplan/translations/en.json';

const urlLng = new URLSearchParams(window.location.search).get('lng');
const savedLanguage = urlLng || localStorage.getItem('i18nextLng') || 'it';

i18n.use(initReactI18next).init({
  resources: {
    it: {
      common: commonIt,
      navigation: navigationIt,
      validation: validationIt,
      errors: errorsIt,
      holidays: holidaysIt,
      clients: clientsIt,
      companies: companiesIt,
      users: usersIt,
      projects: projectsIt,
      planning: planningIt,
      timesheet: timesheetIt,
      estimator: estimatorIt,
      reconciliation: reconciliationIt,
      templateconfig: templateconfigIt,
      tmplanning: tmplanningIt,
      capacityPlan: capacityPlanIt,
      dashboard: dashboardIt,
      timesheetsnapshots: timesheetsnapshotsIt,
      timeoffplan: timeoffplanIt,
    },
    en: {
      common: commonEn,
      navigation: navigationEn,
      validation: validationEn,
      errors: errorsEn,
      holidays: holidaysEn,
      clients: clientsEn,
      companies: companiesEn,
      users: usersEn,
      projects: projectsEn,
      planning: planningEn,
      timesheet: timesheetEn,
      estimator: estimatorEn,
      reconciliation: reconciliationEn,
      templateconfig: templateconfigEn,
      tmplanning: tmplanningEn,
      capacityPlan: capacityPlanEn,
      dashboard: dashboardEn,
      timesheetsnapshots: timesheetsnapshotsEn,
      timeoffplan: timeoffplanEn,
    },
  },
  lng: savedLanguage,
  fallbackLng: 'it',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = savedLanguage;

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
});

export default i18n;
