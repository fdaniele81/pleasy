import React, { memo } from "react";
import { useTranslation } from "react-i18next";

const EstimateInfoBar = memo(function EstimateInfoBar({ clients, formData, projectKey }) {
  const { t } = useTranslation(['estimator']);

  return (
    <div className="from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 px-4 py-2 mb-4">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">{t('estimator:infoClientLabel')}</span>
          <span className="text-gray-900">
            {clients.find((c) => c.client_id === formData.client_id)?.client_name || "-"}
          </span>
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
    </div>
  );
});

export default EstimateInfoBar;
