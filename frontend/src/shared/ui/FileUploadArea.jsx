import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import Button from './Button';

const FileUploadArea = ({
  selectedFile,
  onFileChange,
  onUpload,
  uploading = false,
  accept = '.xls,.xlsx',
  placeholder,
  buttonLabel,
  loadingLabel,
  className = ''
}) => {
  const { t } = useTranslation(['common']);
  const resolvedPlaceholder = placeholder || t('common:clickToChooseFile');
  const resolvedButtonLabel = buttonLabel || t('common:upload');
  const resolvedLoadingLabel = loadingLabel || t('common:uploading');
  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div
            onClick={handleBrowseClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-cyan-400 hover:bg-white cursor-pointer transition-colors"
          >
            <p className="text-sm text-gray-600 text-center truncate">
              {selectedFile ? selectedFile.name : resolvedPlaceholder}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        <Button
          onClick={onUpload}
          disabled={!selectedFile || uploading}
          color="green"
          loading={uploading}
          icon={uploading ? null : Upload}
        >
          {uploading ? resolvedLoadingLabel : resolvedButtonLabel}
        </Button>
      </div>
    </div>
  );
};

FileUploadArea.propTypes = {
  selectedFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  accept: PropTypes.string,
  placeholder: PropTypes.string,
  buttonLabel: PropTypes.string,
  loadingLabel: PropTypes.string,
  className: PropTypes.string,
};

export default FileUploadArea;
