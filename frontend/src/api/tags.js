export const TAG_TYPES = {
  TASK: 'Task',
  PROJECT: 'Project',
  CLIENT: 'Client',
  COMPANY: 'Company',
  USER: 'User',
  AUTH: 'Auth',

  TIMESHEET: 'Timesheet',
  TIME_OFF: 'TimeOff',
  TIME_OFF_TYPE: 'TimeOffType',
  PLANNING: 'Planning',

  ESTIMATE: 'Estimate',
  PROJECT_DRAFT: 'ProjectDraft',
  SNAPSHOT: 'Snapshot',
  DASHBOARD: 'Dashboard',

  HOLIDAY: 'Holiday',
  RECONCILIATION: 'Reconciliation',

  LIST: 'LIST',
};

export const providesList = (resultsWithIds, tagType) => {
  return resultsWithIds
    ? [
        { type: tagType, id: 'LIST' },
        ...resultsWithIds.map(({ id }) => ({ type: tagType, id })),
      ]
    : [{ type: tagType, id: 'LIST' }];
};

export const providesListByKey = (resultsWithKey, tagType, keyField) => {
  return resultsWithKey
    ? [
        { type: tagType, id: 'LIST' },
        ...resultsWithKey.map((item) => ({ type: tagType, id: item[keyField] })),
      ]
    : [{ type: tagType, id: 'LIST' }];
};

export const invalidatesList = (tagType) => [{ type: tagType, id: 'LIST' }];

export const invalidatesItemAndList = (tagType, id) => [
  { type: tagType, id },
  { type: tagType, id: 'LIST' },
];
