import React, { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

const EstimateInfoBar = memo(function EstimateInfoBar({ clients, formData, projectKey }) {
  const { t } = useTranslation(['estimator']);
  const [expanded, setExpanded] = useState(false);

  const clientName = clients.find((c) => c.client_id === formData.client_id)?.client_name || "-";

  return (
    <div className="from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 px-3 sm:px-4 py-2 mb-4">
      {/* Desktop: full layout */}
      <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">{t('estimator:infoClientLabel')}</span>
          <span className="text-gray-900">{clientName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">{t('estimator:infoCodeLabel')}</span>
          <span className="text-gray-900">{projectKey}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">{t('estimator:infoTitleLabel')}</span>
          <span className="text-gray-900">{formData.title}</span>
        </div>
        {formData.description && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">{t('estimator:infoDescriptionLabel')}</span>
            <span className="text-gray-900">{formData.description}</span>
          </div>
        )}
      </div>

      {/* Mobile: compact with expand */}
      <div className="sm:hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm"
        >
          <span className="truncate text-gray-900">
            <span className="font-semibold text-gray-600">{clientName}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="font-medium">{projectKey}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="truncate">{formData.title}</span>
          </span>
          {expanded ? (
            <ChevronUp size={16} className="shrink-0 ml-2 text-gray-400" />
          ) : (
            <ChevronDown size={16} className="shrink-0 ml-2 text-gray-400" />
          )}
        </button>
        {expanded && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600">{t('estimator:infoClientLabel')}</span>
              <span className="text-gray-900">{clientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600">{t('estimator:infoCodeLabel')}</span>
              <span className="text-gray-900">{projectKey}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600">{t('estimator:infoTitleLabel')}</span>
              <span className="text-gray-900">{formData.title}</span>
            </div>
            {formData.description && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">{t('estimator:infoDescriptionLabel')}</span>
                <span className="text-gray-900">{formData.description}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default EstimateInfoBar;
