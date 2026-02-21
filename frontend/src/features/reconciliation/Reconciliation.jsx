import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader2, FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import logger from '../../utils/logger';
import { useReconciliationData } from './hooks/useReconciliationData';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import AlertBanner from '../../shared/ui/AlertBanner';
import FileUploadArea from '../../shared/ui/FileUploadArea';
import TableContainer from '../../shared/ui/table/TableContainer';

function Reconciliation() {
  const { t } = useTranslation(['reconciliation', 'common']);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const dispatch = useDispatch();

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
    const ALLOWED_EXTENSIONS = ['.xls', '.xlsx'];
    const ALLOWED_MIME_TYPES = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

    const formData = new FormData();
    formData.append('excelFile', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reconciliation/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
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
      } else {
        let errorText = data.error || t('reconciliation:uploadError');
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

        dispatch({
          type: 'planning/showToast',
          payload: { message: errorText, type: 'error' }
        });
      }
    } catch (error) {
      logger.error('Upload error:', error);
      dispatch({
        type: 'planning/showToast',
        payload: { message: t('reconciliation:connectionError'), type: 'error' }
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
          <span className="text-xl text-gray-700">{t('reconciliation:loadingData')}</span>
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
              accept=".xls,.xlsx"
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
                        className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center gap-3 transition-colors text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}

                        <div className={`w-3 h-3 rounded-full ${isKeyMatch ? 'bg-green-500' : 'bg-red-500'}`} />

                        <span className="font-semibold text-gray-900 flex-1 truncate">{externalKey}</span>

                        <span className="text-sm text-gray-500">
                          <span className="font-medium">{keyData.length}</span> {keyData.length === 1 ? t('reconciliation:userSingular') : t('reconciliation:usersPlural')}
                        </span>

                        <span className="text-sm text-gray-500 ml-4">
                          {t('reconciliation:diff')}:{' '}
                          <span className={`font-semibold ${isKeyMatch ? 'text-green-600' : 'text-red-600'}`}>
                            {formatHours(Math.abs(keyTotalDiff))}h
                          </span>
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="overflow-x-auto">
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
