import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useDispatch } from "react-redux";
import { CheckCircle, Database, LayoutPanelLeftIcon } from "lucide-react";
import {
  useGetReconciliationTemplateQuery,
  useUploadReconciliationStagingMutation,
  useSaveReconciliationTemplateMutation,
  useDeleteReconciliationTemplateMutation,
  usePreviewReconciliationQueryMutation,
  useLazyPreviewReconciliationStagingQuery,
  useLazyPreviewReconciliationUsersQuery,
} from "./api/reconciliationEndpoints";
import StagingPreviewModal from "../../shared/components/gantt/StagingPreviewModal";
import Button from "../../shared/ui/Button";
import PageHeader from "../../shared/ui/PageHeader";
import { useAuth } from "../../hooks";
import { ROLES } from "../../constants";
import { addToast } from "../../store/slices/toastSlice";

const validateSqlQuery = (query, t) => {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: t('templateconfig:invalidQuery') };
  }

  const normalizedQuery = query.toUpperCase().replace(/\s+/g, ' ').trim();

  const DANGEROUS_KEYWORDS = [
    'DROP', 'TRUNCATE', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
    'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'XP_', 'SP_', '--', '/*',
    'SHUTDOWN', 'BACKUP', 'RESTORE', 'KILL'
  ];

  for (const keyword of DANGEROUS_KEYWORDS) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('_', '.');
    const regex = new RegExp(`(^|\\s|;)${escapedKeyword}`, 'i');
    if (regex.test(normalizedQuery)) {
      return {
        valid: false,
        error: t('templateconfig:forbiddenKeyword', { keyword })
      };
    }
  }

  if (!normalizedQuery.startsWith('SELECT ')) {
    return {
      valid: false,
      error: t('templateconfig:selectOnly')
    };
  }

  const dangerousPatterns = [
    /INTO\s+OUTFILE/i,
    /INTO\s+DUMPFILE/i,
    /LOAD_FILE/i,
    /BENCHMARK\s*\(/i,
    /SLEEP\s*\(/i,
    /WAITFOR\s+DELAY/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return {
        valid: false,
        error: t('templateconfig:forbiddenPattern')
      };
    }
  }

  return { valid: true };
};

function TemplateConfiguration() {
  const { t } = useTranslation(['templateconfig', 'common']);
  const { user } = useAuth();
  const dispatch = useDispatch();

  const { data: template, isLoading: loadingTemplate } = useGetReconciliationTemplateQuery(
    undefined,
    { skip: user?.role_id !== ROLES.PM }
  );

  const [uploadStaging, { isLoading: uploadingStaging }] = useUploadReconciliationStagingMutation();
  const [saveTemplate, { isLoading: savingConfig }] = useSaveReconciliationTemplateMutation();
  const [deleteTemplate] = useDeleteReconciliationTemplateMutation();
  const [previewQuery, { isLoading: loadingPreviewQuery }] = usePreviewReconciliationQueryMutation();
  const [triggerPreviewStaging, { data: stagingModalData, isFetching: loadingStagingModal }] = useLazyPreviewReconciliationStagingQuery();
  const [triggerPreviewUsers, { data: usersModalData, isFetching: loadingUsersModal }] = useLazyPreviewReconciliationUsersQuery();

  const [sqlQuery, setSqlQuery] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [queryTested, setQueryTested] = useState(false);

  const [previewData, setPreviewData] = useState(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [showStagingModal, setShowStagingModal] = useState(false);

  useEffect(() => {
    if (template) {
      setSqlQuery(template.sql_query || "");
    }
  }, [template]);

  const handleUploadStaging = async () => {
    if (!excelFile) {
      dispatch(addToast({ message: t('templateconfig:selectExcelFirst'), type: "error" }));
      return;
    }

    try {
      const data = await uploadStaging(excelFile).unwrap();
      dispatch(addToast({
        message: data.message || t('templateconfig:stagingLoaded', { count: data.rowsInserted }),
        type: "success",
      }));
      setExcelFile(null);
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:stagingLoadError'),
        type: "error",
      }));
    }
  };

  const handleSaveConfig = async () => {
    if (!sqlQuery) {
      dispatch(addToast({ message: t('templateconfig:sqlRequired'), type: "error" }));
      return;
    }

    const sqlValidation = validateSqlQuery(sqlQuery, t);
    if (!sqlValidation.valid) {
      dispatch(addToast({ message: sqlValidation.error, type: "error" }));
      return;
    }

    if (!template) {
      dispatch(addToast({
        message: t('templateconfig:loadStagingFirst'),
        type: "error",
      }));
      return;
    }

    try {
      await saveTemplate({
        templateName: template.template_name || t('templateconfig:templateReconciliation'),
        sqlQuery,
      }).unwrap();
      dispatch(addToast({ message: t('templateconfig:templateUpdated'), type: "success" }));
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:saveError'),
        type: "error",
      }));
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await deleteTemplate().unwrap();
      dispatch(addToast({ message: t('templateconfig:templateDeleted'), type: "success" }));
      setSqlQuery("");
      setExcelFile(null);
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:deleteError'),
        type: "error",
      }));
    }
  };

  const handlePreviewQuery = async () => {
    if (!sqlQuery.trim()) {
      dispatch(addToast({
        message: t('templateconfig:enterQueryFirst'),
        type: "error",
      }));
      return;
    }

    const sqlValidation = validateSqlQuery(sqlQuery, t);
    if (!sqlValidation.valid) {
      dispatch(addToast({ message: sqlValidation.error, type: "error" }));
      return;
    }

    try {
      const data = await previewQuery(sqlQuery).unwrap();
      setPreviewData(data);
      setShowPreviewPanel(true);
      setQueryTested(true);
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:queryError'),
        type: "error",
      }));
    }
  };

  const handlePreviewStaging = async () => {
    if (!template) {
      dispatch(addToast({
        message: t('templateconfig:saveTemplateFirst'),
        type: "error",
      }));
      return;
    }

    setShowStagingModal(true);
    try {
      await triggerPreviewStaging().unwrap();
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:stagingTableError'),
        type: "error",
      }));
      setShowStagingModal(false);
    }
  };

  const handleLoadUsersForModal = async () => {
    try {
      await triggerPreviewUsers().unwrap();
    } catch (error) {
      dispatch(addToast({
        message: error?.data?.error || t('templateconfig:usersLoadError'),
        type: "error",
      }));
    }
  };

  if (user?.role_id !== "PM") {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {t('templateconfig:pmOnlyAccess')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={LayoutPanelLeftIcon}
            title={t('templateconfig:title')}
            description={t('templateconfig:description')}
          />

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {loadingTemplate ? (
              <p className="text-gray-500">{t('common:loading')}</p>
            ) : (
              <div className="space-y-4">
                {template && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                          {t('templateconfig:templateActive')}
                        </span>
                      </div>
                      <Button
                        confirmAction
                        onConfirm={handleDeleteTemplate}
                        itemName="template"
                        size="md"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>{t('templateconfig:stagingTable')}</strong>{" "}
                        {template.staging_table_name}
                      </p>
                      <p>
                        <strong>{t('templateconfig:usersView')}</strong> pm_users_view_
                        {user.user_id.replace(/-/g, "_")}
                      </p>
                      {template.last_upload_date && (
                        <p>
                          <strong>{t('templateconfig:lastUpload')}</strong>{" "}
                          {template.last_upload_date}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('templateconfig:excelFileForStaging')} {!template && "*"}
                    <span className="text-xs text-gray-500 ml-2">
                      {t('templateconfig:uploadDataToStaging')}
                    </span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 relative">
                      <input
                        id="excel-file-input"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={(e) => setExcelFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="excel-file-input"
                        className="flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                      >
                        <span className="text-gray-600 text-sm truncate">
                          {excelFile ? excelFile.name : t('templateconfig:clickToChooseExcel')}
                        </span>
                      </label>
                      {excelFile && (
                        <p className="mt-1 text-xs text-gray-500">
                          {(excelFile.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleUploadStaging}
                      disabled={!excelFile}
                      loading={uploadingStaging}
                      color="cyan"
                      className="w-40"
                    >
                      {uploadingStaging
                        ? t('common:loading')
                        : template
                        ? t('templateconfig:updateStaging')
                        : t('templateconfig:loadStaging')}
                    </Button>
                    <Button
                      onClick={handlePreviewStaging}
                      disabled={!template}
                      loading={loadingStagingModal}
                      color="cyan"
                      icon={Database}
                      iconSize={16}
                      className="w-44"
                      title={t('templateconfig:stagingPreviewTitle')}
                    >
                      {loadingStagingModal
                        ? t('common:loading')
                        : t('templateconfig:preview')}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('templateconfig:sqlQueryMapping')} *
                    <span className="text-xs text-gray-500 ml-2">
                      {t('templateconfig:queryMustReturn')}
                    </span>
                  </label>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => {
                      setSqlQuery(e.target.value);
                      setQueryTested(false);
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm h-64"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Button
                      onClick={handlePreviewQuery}
                      loading={loadingPreviewQuery}
                      variant="ghost"
                      color="green"
                      size="sm"
                      icon={CheckCircle}
                      iconSize={16}
                      title={t('templateconfig:testQueryTitle')}
                    >
                      {loadingPreviewQuery
                        ? t('common:loading')
                        : t('templateconfig:testQuery')}
                    </Button>
                    <Button
                      onClick={handleSaveConfig}
                      disabled={!template || !queryTested}
                      loading={savingConfig}
                      color="cyan"
                      size="lg"
                      icon={CheckCircle}
                      iconSize={16}
                      title={
                        !template
                          ? t('templateconfig:loadStagingToEnableSave')
                          : !queryTested
                          ? t('templateconfig:runTestQueryFirst')
                          : ""
                      }
                    >
                      {savingConfig ? t('templateconfig:saving') : t('templateconfig:saveTemplate')}
                    </Button>
                  </div>
                </div>

                {showPreviewPanel && previewData && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-green-900">
                        {t('templateconfig:queryTestResult')}
                      </h3>
                      <button
                        onClick={() => setShowPreviewPanel(false)}
                        className="text-green-600 hover:text-green-800 text-xl hover:bg-green-100 rounded px-2 transition-colors"
                      >
                        X
                      </button>
                    </div>

                    {previewData.rows && previewData.rows.length > 0 ? (
                      <div className="bg-white rounded overflow-hidden">
                        <div className="overflow-x-auto max-h-96">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                {previewData.columns.map((col, idx) => (
                                  <th
                                    key={idx}
                                    className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {previewData.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50">
                                  {previewData.columns.map((col, colIdx) => (
                                    <td
                                      key={colIdx}
                                      className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap"
                                    >
                                      {row[col] !== null &&
                                      row[col] !== undefined
                                        ? String(row[col])
                                        : "-"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">
                            {t('templateconfig:totalRows')} {previewData.rows.length}
                            {previewData.totalRows &&
                              previewData.totalRows >
                                previewData.rows.length && (
                                <span className="ml-2 text-yellow-600">
                                  {t('templateconfig:showingFirstOf', { shown: previewData.rows.length, total: previewData.totalRows })}
                                </span>
                              )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded p-4 text-center text-gray-500">
                        {t('templateconfig:noDataFound')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <StagingPreviewModal
        isOpen={showStagingModal}
        onClose={() => setShowStagingModal(false)}
        stagingData={stagingModalData}
        usersData={usersModalData}
        loadingStaging={loadingStagingModal}
        loadingUsers={loadingUsersModal}
        onLoadUsers={handleLoadUsersForModal}
      />
    </div>
  );
}

export default TemplateConfiguration;
