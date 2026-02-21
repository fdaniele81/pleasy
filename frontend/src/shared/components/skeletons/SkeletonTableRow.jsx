import React, { memo } from 'react';
import { SkeletonLine } from './SkeletonBase';

const SkeletonTableRow = memo(function SkeletonTableRow({
  columns = 7,
  hasCheckbox = false,
  className = '',
}) {
  return (
    <tr className={`animate-pulse ${className}`}>
      {hasCheckbox && (
        <td className="px-2 py-3">
          <div className="w-4 h-4 bg-gray-200 rounded" />
        </td>
      )}

      <td className="px-4 py-3">
        <SkeletonLine width="70%" height="0.875rem" />
      </td>

      {Array.from({ length: columns - 1 }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <SkeletonLine
            width={idx === columns - 2 ? '50%' : '60%'}
            height="0.75rem"
          />
        </td>
      ))}
    </tr>
  );
});

export const SkeletonTableRows = memo(function SkeletonTableRows({
  rows = 5,
  columns = 7,
  hasCheckbox = false,
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonTableRow
          key={idx}
          columns={columns}
          hasCheckbox={hasCheckbox}
        />
      ))}
    </>
  );
});

export const SkeletonTable = memo(function SkeletonTable({
  rows = 5,
  columns = 7,
  hasCheckbox = false,
  headerHeight = '2.5rem',
  className = '',
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="bg-gray-100 animate-pulse"
        style={{ height: headerHeight }}
      />

      <table className="w-full">
        <tbody className="divide-y divide-gray-100">
          <SkeletonTableRows
            rows={rows}
            columns={columns}
            hasCheckbox={hasCheckbox}
          />
        </tbody>
      </table>
    </div>
  );
});

export default SkeletonTableRow;
