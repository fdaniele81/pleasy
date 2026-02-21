import React from 'react';
import {
  Plane,
  Stethoscope,
  GraduationCap,
  Baby,
  CalendarDays,
  FileText,
  Calendar
} from 'lucide-react';

export const TimeOffIcon = {
  VACATION: Plane,
  SICK: Stethoscope,
  TRAINING: GraduationCap,
  MATERNITY_PATERNITY: Baby,
  OTHER: FileText,
  MULTIPLE: Calendar,
};

export const getTimeOffIcon = (timeOffType, props = {}) => {
  if (timeOffType instanceof Set) {
    if (timeOffType.size === 0) return null;
    if (timeOffType.size > 1) {
      const Icon = TimeOffIcon.MULTIPLE;
      return <Icon {...props} />;
    }
    timeOffType = Array.from(timeOffType)[0];
  }

  const Icon = TimeOffIcon[timeOffType];
  if (!Icon) return null;

  return <Icon {...props} />;
};

export const TimesheetTimeOffConfig = {
  VACATION: {
    icon: Plane,
    label: 'Ferie / Permessi',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    inputBorderColor: 'border-green-500',
    shadowColor: 'shadow-[2px_0_0_0_rgb(240,253,244)]',
  },
  OTHER: {
    icon: FileText,
    label: 'Altro',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    inputBorderColor: 'border-yellow-500',
    shadowColor: 'shadow-[2px_0_0_0_rgb(254,252,232)]',
  },
};
