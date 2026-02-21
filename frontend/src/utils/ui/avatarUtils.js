export const getInitials = (fullName) => {
  if (!fullName) return '?';

  const parts = fullName.trim().split(' ');

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return fullName.substring(0, 2).toUpperCase();
};

export const getColorFromName = (name) => {
  if (!name) return 'bg-gray-500';

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return colors[hash % colors.length];
};

export const getAvatarProps = (fullName) => {
  return {
    initials: getInitials(fullName),
    colorClass: getColorFromName(fullName)
  };
};
