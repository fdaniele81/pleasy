import React from 'react';
import { SkeletonLine, SkeletonBlock } from '../../../shared/components/skeletons';

const DefaultSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, idx) => (
      <SkeletonLine
        key={idx}
        width={idx === rows - 1 ? '60%' : idx % 2 === 0 ? '100%' : '85%'}
        height="0.875rem"
      />
    ))}
  </div>
);

const DashboardCard = ({
  title,
  icon: Icon,
  action,
  children,
  loading = false,
  skeleton = null,
  skeletonRows = 4,
  className = '',
  headerClassName = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {(title || Icon || action) && (
        <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon size={20} className="text-gray-600" />}
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          </div>

          {action && (
            <button
              onClick={action.onClick}
              disabled={loading || action.disabled}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.icon && <action.icon size={16} />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}

      {loading ? (
        skeleton || <DefaultSkeleton rows={skeletonRows} />
      ) : (
        children
      )}
    </div>
  );
};

export default DashboardCard;
