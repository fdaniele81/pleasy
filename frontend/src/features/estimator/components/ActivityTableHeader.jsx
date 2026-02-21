import React from "react";
import { useTranslation } from "react-i18next";

const ActivityTableHeader = ({ formData }) => {
  const { t } = useTranslation(['estimator', 'common']);
  return (
    <thead className="bg-cyan-700 border-b border-cyan-800">
      <tr>
        <th className="px-0.5 lg:px-3 py-2 text-left text-xs lg:text-sm font-semibold text-white align-bottom border border-cyan-600">
          {t('estimator:tableEstimate')}
        </th>
        <th className="px-0.5 lg:px-3 py-2 text-left text-xs lg:text-sm font-semibold text-white align-bottom border border-cyan-600">
          {t('estimator:itemDetailPlaceholder')}
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseAnalysis')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_analysis || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseDevelopment')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_development || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseInternalTest')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_internal_test || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              UAT
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_uat || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseRelease')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_release || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              PM
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_pm || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseStartup')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_startup || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseDocumentation')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.pct_documentation || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('estimator:phaseContingency')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200 mb-0.5">
              (h)
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              {parseFloat(formData?.contingency_percentage || 0).toFixed(1)}%
            </div>
          </div>
        </th>
        <th className="px-0 lg:px-1 text-center align-bottom border border-cyan-600" style={{ height: '140px' }}>
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-xs lg:text-sm font-semibold text-white mb-1">
              {t('common:total')}
            </div>
            <div className="text-[10px] lg:text-xs font-normal text-cyan-200">
              (h)
            </div>
          </div>
        </th>
        <th className="px-0.5 lg:px-2 py-2 text-center text-xs lg:text-sm font-semibold text-white align-bottom border border-cyan-600">
          {t('common:actions')}
        </th>
      </tr>
    </thead>
  );
};

export default ActivityTableHeader;
