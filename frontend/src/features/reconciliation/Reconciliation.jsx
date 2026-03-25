import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader2, FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import logger from '../../utils/logger';
import { translateError } from '../../utils/translateError';
import { useReconciliationData } from './hooks/useReconciliationData';
import { useUploadReconciliationFileMutation } from '../templateconfiguration/api/reconciliationEndpoints';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import AlertBanner from '../../shared/ui/AlertBanner';
import FileUploadArea from '../../shared/ui/FileUploadArea';
import TableContainer from '../../shared/ui/table/TableContainer';

function Reconciliation() {
  const { t } = useTranslation(['reconciliation', 'common']);
  const dispatch = useDispatch();
  const [uploadFile] = useUploadReconciliationFileMutation();

  const { syncData, loading, hasTemplate, hasValidQuery, refetch } = useReconciliationData();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const groupedData = useMemo(() => {
    const groups = {};
    syncData.forEach(row => {
      if (!groups[row.external_key]) {
        groups[row.external_key] = [];
      }
      groups[row.external_key].push(row);
    });
    return groups;
  }, [syncData]);

  const externalKeys = Object.keys(groupedData).sort();

  const formatHours = (hours) => {
    return Math.round(hours * 10) / 10;
  };

  const validateFile = async (file) => {
    const ALLOWED_EXTENSIONS = ['.xls', '.xlsx', '.csv'];
    const ALLOWED_MIME_TYPES = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
    ];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const XLSX_MAGIC = [0x50, 0x4B, 0x03, 0x04];
    const XLS_MAGIC = [0xD0, 0xCF, 0x11, 0xE0];

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return { valid: false, error: t('reconciliation:invalidExtension') };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: t('reconciliation:invalidFormat') };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: t('reconciliation:fileTooLarge', { max: MAX_FILE_SIZE / 1024 / 1024 }) };
    }

    const isCsv = fileName.endsWith('.csv');

    if (!isCsv) {
      try {
        const headerBytes = await readFileHeader(file, 4);
        const isXlsx = XLSX_MAGIC.every((byte, i) => headerBytes[i] === byte);
        const isXls = XLS_MAGIC.every((byte, i) => headerBytes[i] === byte);

        if (!isXlsx && !isXls) {
          return { valid: false, error: t('reconciliation:invalidContent') };
        }
      } catch {
        return { valid: false, error: t('reconciliation:cannotVerifyFormat') };
      }
    }

    return { valid: true };
  };

  const readFileHeader = (file, bytesToRead) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arr = new Uint8Array(reader.result);
        resolve(arr);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file.slice(0, bytesToRead));
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = await validateFile(file);
      if (!validation.valid) {
        dispatch({
          type: 'planning/showToast',
          payload: { message: validation.error, type: 'error' }
        });
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const toggleKey = (key) => {
    setExpandedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      dispatch({
        type: 'planning/showToast',
        payload: { message: t('reconciliation:selectExcelFile'), type: 'error' }
      });
      return;
    }

    setUploading(true);

    try {
      const data = await uploadFile(selectedFile).unwrap();

      let successText = data.message;
      if (data.rowsInserted > 0) {
        successText += ` - ${t('reconciliation:rowsLoaded', { count: data.rowsInserted })}`;
      }
      if (data.rowsProcessed > 0) {
        successText += ` - ${t('reconciliation:rowsReconciled', { count: data.rowsProcessed })}`;
      }

      dispatch({
        type: 'planning/showToast',
        payload: { message: successText, type: 'success' }
      });
      setSelectedFile(null);

      setTimeout(() => refetch(), 1000);
    } catch (err) {
      const data = err.data || {};
      let errorText = translateError(data, t('reconciliation:uploadError'));
      if (data.detail) {
        errorText += ` - ${data.detail}`;
      }
      if (data.problematicKeys && data.problematicKeys.length > 0) {
        errorText += ` | ${t('reconciliation:problematicKeys')} ${data.problematicKeys.join(', ')}`;
      }
      if (data.missing && data.missing.length > 0) {
        errorText += ` | ${t('reconciliation:missingColumns')} ${data.missing.join(', ')}`;
      }
      if (data.suggestion) {
        errorText += ` | ${data.suggestion}`;
      }

      logger.error('Upload error:', err);
      dispatch({
        type: 'planning/showToast',
        payload: { message: errorText, type: 'error' }
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mr-3" />
          <span className="text-lg sm:text-xl text-gray-700">{t('reconciliation:loadingData')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
      <div className="px-4 pt-2 pb-2 sm:p-4">
        <div className="max-w-full mx-auto">
          <PageHeader
            icon={FileSpreadsheet}
            title={t('reconciliation:title')}
            description={t('reconciliation:description')}
          />

          {!hasTemplate && (
            <AlertBanner variant="warning">
              <span dangerouslySetInnerHTML={{ __html: t('reconciliation:noTemplateWarning') }} />
            </AlertBanner>
          )}

          {hasTemplate && !hasValidQuery && (
            <AlertBanner variant="warning">
              <span dangerouslySetInnerHTML={{ __html: t('reconciliation:emptyQueryWarning') }} />
            </AlertBanner>
          )}

          {hasTemplate && hasValidQuery && (
            <FileUploadArea
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              onUpload={handleUpload}
              uploading={uploading}
              accept=".xls,.xlsx,.csv"
              placeholder={t('reconciliation:clickToChooseFile')}
              buttonLabel={t('reconciliation:loadAndRecalculate')}
              loadingLabel={t('common:loading')}
              className="mb-4"
            />
          )}

          {syncData.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title={t('reconciliation:noReconciliationData')}
              message={t('reconciliation:uploadFileMessage')}
            />
          ) : (
            <TableContainer maxHeight="calc(100vh - 320px)">
              <div className="divide-y divide-gray-200">
                {externalKeys.map(externalKey => {
                  const keyData = groupedData[externalKey];
                  const keyTotalReconciliation = keyData.reduce((sum, row) => sum + parseFloat(row.reconciliation_hours || 0), 0);
                  const keyTotalActual = keyData.reduce((sum, row) => sum + parseFloat(row.actual_hours || 0), 0);
                  const keyTotalDiff = keyTotalActual - keyTotalReconciliation;
                  const isKeyMatch = Math.abs(keyTotalDiff) < 0.01;
                  const isExpanded = expandedKeys.has(externalKey);

                  return (
                    <div key={externalKey}>
                      <button
                        onClick={() => toggleKey(externalKey)}
                        className="w-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 px-3 sm:px-4 py-3 sm:py-3 flex items-center gap-2 sm:gap-3 transition-colors text-left min-h-[52px]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                        )}

                        <div className={`w-3 h-3 rounded-full shrink-0 ${isKeyMatch ? 'bg-green-500' : 'bg-red-500'}`} />

                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
                          <span className="font-semibold text-gray-900 truncate text-sm sm:text-base">{externalKey}</span>
                          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
                            <span>
                              <span className="font-medium">{keyData.length}</span> {keyData.length === 1 ? t('reconciliation:userSingular') : t('reconciliation:usersPlural')}
                            </span>
                            <span>
                              {t('reconciliation:diff')}:{' '}
                              <span className={`font-semibold ${isKeyMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {formatHours(Math.abs(keyTotalDiff))}h
                              </span>
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <>
                          {/* Desktop table */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                    {t('reconciliation:userColumn')}
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    {t('reconciliation:externalTimesheets')}
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    {t('reconciliation:pleasy')}
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                    {t('reconciliation:diff')}
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                    {t('reconciliation:statusColumn')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {keyData.map((row, idx) => {
                                  const diff = parseFloat(row.actual_hours || 0) - parseFloat(row.reconciliation_hours || 0);
                                  const isMatch = Math.abs(diff) < 0.01;

                                  return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-gray-900">
                                        {row.user_name || row.user_id}
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium text-gray-700">
                                        {formatHours(row.reconciliation_hours)}h
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium text-gray-700">
                                        {formatHours(row.actual_hours)}h
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium">
                                        <span className={isMatch ? 'text-green-600' : 'text-red-600'}>
                                          {formatHours(Math.abs(diff))}h
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {isMatch ? (
                                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                        ) : (
                                          <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                                  <td className="px-4 py-2 text-gray-900">{t('reconciliation:total')}</td>
                                  <td className="px-4 py-2 text-right text-gray-700">
                                    {formatHours(keyTotalReconciliation)}h
                                  </td>
                                  <td className="px-4 py-2 text-right text-gray-700">
                                    {formatHours(keyTotalActual)}h
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <span className={isKeyMatch ? 'text-green-600' : 'text-red-600'}>
                                      {formatHours(Math.abs(keyTotalDiff))}h
                                    </span>
                                  </td>
                                  <td className="px-4 py-2"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Mobile card layout */}
                          <div className="sm:hidden divide-y divide-gray-100 bg-white">
                            {keyData.map((row, idx) => {
                              const diff = parseFloat(row.actual_hours || 0) - parseFloat(row.reconciliation_hours || 0);
                              const isMatch = Math.abs(diff) < 0.01;

                              return (
                                <div key={idx} className="px-3 py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900 text-sm truncate mr-2">
                                      {row.user_name || row.user_id}
                                    </span>
                                    {isMatch ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500 block">{t('reconciliation:externalTimesheets')}</span>
                                      <span className="font-medium text-gray-700">{formatHours(row.reconciliation_hours)}h</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">{t('reconciliation:pleasy')}</span>
                                      <span className="font-medium text-gray-700">{formatHours(row.actual_hours)}h</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">{t('reconciliation:diff')}</span>
                                      <span className={`font-semibold ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatHours(Math.abs(diff))}h
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Mobile totals */}
                            <div className="px-3 py-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900 text-sm">{t('reconciliation:total')}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500 block">{t('reconciliation:externalTimesheets')}</span>
                                  <span className="font-semibold text-gray-700">{formatHours(keyTotalReconciliation)}h</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">{t('reconciliation:pleasy')}</span>
                                  <span className="font-semibold text-gray-700">{formatHours(keyTotalActual)}h</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">{t('reconciliation:diff')}</span>
                                  <span className={`font-semibold ${isKeyMatch ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatHours(Math.abs(keyTotalDiff))}h
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </TableContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reconciliation;
