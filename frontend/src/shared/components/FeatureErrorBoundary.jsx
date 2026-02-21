import React from 'react';
import i18next from 'i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import logger from '../../utils/logger';

class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const { featureName = 'Feature' } = this.props;
    logger.critical(`[${featureName}] Error caught:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { featureName = i18next.t('errors:thisSection') } = this.props;

    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg m-4">
          <div className="max-w-sm w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {i18next.t('errors:featureLoadError')}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {i18next.t('errors:featureErrorMessage', { featureName })}
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-left">
                <p className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <Button
              onClick={this.handleRetry}
              variant="secondary"
              size="md"
              icon={RefreshCw}
            >
              {i18next.t('errors:retry')}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FeatureErrorBoundary;
