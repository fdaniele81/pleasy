import React, { memo } from 'react';
import { SkeletonLine, SkeletonBlock } from './SkeletonBase';

const SkeletonCard = memo(function SkeletonCard({
  hasHeader = true,
  hasIcon = true,
  hasAction = false,
  bodyLines = 3,
  bodyHeight = null,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 animate-pulse ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {hasIcon && (
              <div className="w-5 h-5 bg-gray-200 rounded" />
            )}
            <SkeletonLine width="150px" height="1.25rem" />
          </div>
          {hasAction && (
            <SkeletonLine width="80px" height="2rem" className="rounded-lg" />
          )}
        </div>
      )}

      {bodyHeight ? (
        <SkeletonBlock height={bodyHeight} />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: bodyLines }).map((_, idx) => (
            <SkeletonLine
              key={idx}
              width={idx === bodyLines - 1 ? '60%' : idx % 2 === 0 ? '100%' : '85%'}
              height="0.875rem"
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const SkeletonStatCard = memo(function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonLine width="60%" height="0.75rem" className="mb-2" />
          <SkeletonLine width="40%" height="1.5rem" />
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
});

export const SkeletonDashboardTable = memo(function SkeletonDashboardTable({
  rows = 5,
  hasFilters = true,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 animate-pulse ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <SkeletonLine width="180px" height="1.25rem" />
      </div>

      {hasFilters && (
        <div className="flex gap-4 mb-4">
          <SkeletonLine width="100px" height="2rem" className="rounded-lg" />
          <SkeletonLine width="120px" height="2rem" className="rounded-lg" />
          <div className="flex-1" />
          <SkeletonLine width="80px" height="2rem" className="rounded-lg" />
        </div>
      )}

      <div className="bg-gray-100 h-10 rounded-t-lg mb-1" />

      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-100">
            <SkeletonLine width="30%" height="0.875rem" />
            <SkeletonLine width="12%" height="0.75rem" />
            <SkeletonLine width="12%" height="0.75rem" />
            <SkeletonLine width="12%" height="0.75rem" />
            <SkeletonLine width="12%" height="0.75rem" />
            <SkeletonLine width="10%" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
});

export const SkeletonListItem = memo(function SkeletonListItem({
  hasAvatar = false,
  hasSecondaryText = true,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-3 py-3 animate-pulse ${className}`}>
      {hasAvatar && (
        <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <SkeletonLine width="70%" height="0.875rem" />
        {hasSecondaryText && (
          <SkeletonLine width="50%" height="0.75rem" className="mt-1" />
        )}
      </div>
    </div>
  );
});

export default SkeletonCard;
