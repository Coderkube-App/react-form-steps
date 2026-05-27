import debounce from 'lodash.debounce';

export const createRemoteAutoSave = (
  onAutoSave: (index: number, data: any, merged: any) => Promise<void>
) => {
  return debounce(async (index: number, data: any, merged: any) => {
    try {
      await onAutoSave(index, data, merged);
    } catch (e) {
      console.error('Remote auto-save failed', e);
    }
  }, 800);
};
