import React from 'react';

export const SkeletonPulse = ({ className = '', style = {} }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={style}
  />
);

export const SkeletonLine = ({ width = '100%', height = '1rem', className = '' }) => (
  <SkeletonPulse
    className={className}
    style={{ width, height }}
  />
);

export const SkeletonCircle = ({ size = 40, className = '' }) => (
  <SkeletonPulse
    className={`rounded-full ${className}`}
    style={{ width: size, height: size }}
  />
);

export const SkeletonBlock = ({ width = '100%', height = '100px', className = '' }) => (
  <SkeletonPulse
    className={className}
    style={{ width, height }}
  />
);

export default {
  Pulse: SkeletonPulse,
  Line: SkeletonLine,
  Circle: SkeletonCircle,
  Block: SkeletonBlock,
};
