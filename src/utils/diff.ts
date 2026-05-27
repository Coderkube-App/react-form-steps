/**
 * Simple diff utility to find changed fields between two objects.
 * Returns an object containing only the fields that are different in 'current' compared to 'initial'.
 */
export function getDiff(initial: any, current: any): any {
  const diff: any = {};

  if (!initial) return current;

  Object.keys(current).forEach((key) => {
    if (JSON.stringify(initial[key]) !== JSON.stringify(current[key])) {
      diff[key] = current[key];
    }
  });

  return diff;
}

/**
 * Returns a map of changed field keys.
 */
export function getChangedFieldsMap(initial: any, current: any): Record<string, boolean> {
  const changed: Record<string, boolean> = {};
  
  if (!initial) {
    Object.keys(current).forEach(key => changed[key] = true);
    return changed;
  }

  Object.keys(current).forEach((key) => {
    if (JSON.stringify(initial[key]) !== JSON.stringify(current[key])) {
      changed[key] = true;
    }
  });

  return changed;
}
