export const getStatusBadgeColor = (status) => {
  return status === 'ACTIVE'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
  return status === 'ACTIVE' ? 'Attivo' : 'Inattivo';
};

export const isActive = (entity) => {
  return entity?.status_id === 'ACTIVE';
};
