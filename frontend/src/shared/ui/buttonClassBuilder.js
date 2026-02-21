import {
  BUTTON_SIZES,
  SOLID_COLORS,
  GHOST_COLORS,
  OUTLINE_CLASSES,
  BASE_CLASSES,
  DISABLED_CLASSES
} from './buttonConstants';

export function buildButtonClasses({
  variant = 'solid',
  color = 'blue',
  size = 'md',
  isIconOnly = false,
  isExpandButton = false,
  confirmAction = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = ''
}) {
  const classes = [BASE_CLASSES];

  if (isIconOnly) {
    classes.push('p-2');
  } else {
    classes.push(BUTTON_SIZES[size] || BUTTON_SIZES.md);
  }

  if (variant === 'solid') {
    classes.push(SOLID_COLORS[color] || SOLID_COLORS.blue);
  } else if (variant === 'outline') {
    classes.push(OUTLINE_CLASSES);
  } else if (variant === 'ghost') {
    classes.push(GHOST_COLORS[color] || GHOST_COLORS.blue);
  }

  classes.push(isExpandButton || confirmAction ? 'rounded' : 'rounded-lg');

  if (disabled || loading) {
    classes.push(DISABLED_CLASSES);
  }

  if (variant === 'solid' && !isIconOnly) {
    classes.push('shadow-sm');
  }

  if (fullWidth) {
    classes.push('w-full');
  }

  if (className) {
    classes.push(className);
  }

  return classes.join(' ');
}
