import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FormStepsContextType, StepInfo, StepStatus, PersistenceOptions, DraftData } from '../types';
import { mergeStepData } from '../utils/merge';
import { getChangedFieldsMap } from '../utils/diff';
import { browserStoragePersistence } from '../persistence/browserStorage';
import { serializeFiles, deserializeFiles } from '../utils/fileStorage';
import debounce from 'lodash.debounce';

export const FormStepsContext = createContext<FormStepsContextType | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  formKey?: string;
  persistence?: PersistenceOptions;
  allowJump?: boolean;
  unrestrictedNav?: boolean;
  onStepEnter?: (idx: number) => void;
  onStepComplete?: (idx: number) => void;
  onClear?: () => void;
  defaultValues?: any;
  onSubmit: (payload: any, diff: any) => void | Promise<void>;
  onDataChange?: (data: any) => void;
  onDraftFound?: (draft: any) => void;
}

export const FormStepsProvider: React.FC<ProviderProps> = ({
  children,
  formKey,
  persistence,
  allowJump,
  unrestrictedNav,
  onStepEnter,
  onStepComplete,
  onClear,
  defaultValues,
  onSubmit,
  onDataChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepConfigs, setStepConfigs] = useState<Record<number, { label: string; schema?: any }>>({});
  const [allStepData, setAllStepData] = useState<Record<number, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [resumedDraftData, setResumedDraftData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!defaultValues;

  // Step registration
  const registerStep = useCallback((index: number, label: string, schema?: any) => {
    setStepConfigs((prev) => ({ ...prev, [index]: { label, schema } }));
  }, []);

  const unregisterStep = useCallback((index: number) => {
    setStepConfigs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  // Data management
  const updateStepData = useCallback((index: number, data: any) => {
    setAllStepData((prev) => ({ ...prev, [index]: data }));
  }, []);

  const mergedData = useMemo(() => {
    const stepData = mergeStepData(allStepData);
    let result = { ...resumedDraftData };

    Object.keys(stepData).forEach(key => {
      const val = stepData[key];
      if (val !== undefined && val !== null) {
        result[key] = val;
      }
    });

    if (isEditMode) {
      result = { ...defaultValues, ...result };
    }
    return result;
  }, [allStepData, defaultValues, isEditMode, resumedDraftData]);

  // Trigger onDataChange
  useEffect(() => {
    if (onDataChange) {
      onDataChange(mergedData);
    }
  }, [mergedData, onDataChange]);

  const changedFields = useMemo(() => {
    if (!isEditMode) return {};
    return getChangedFieldsMap(defaultValues, mergedData);
  }, [isEditMode, defaultValues, mergedData]);

  // Status tracking
  const steps: StepInfo[] = useMemo(() => {
    const indices = Object.keys(stepConfigs).map(Number).sort((a, b) => a - b);
    return indices.map((idx) => {
      let status: StepStatus = 'pending';
      if (idx === currentStep) status = 'active';
      else if (completedSteps[idx]) status = 'complete';
      return {
        index: idx,
        label: stepConfigs[idx].label,
        status,
      };
    });
  }, [stepConfigs, currentStep, completedSteps]);

  // Persistence
  const onAutoSaveRef = useRef(persistence?.onAutoSave);
  useEffect(() => {
    onAutoSaveRef.current = persistence?.onAutoSave;
  }, [persistence?.onAutoSave]);

  const remoteSave = useMemo(() => {
    if (persistence?.storageType === 'database') {
      return debounce(async (index: number, data: any, merged: any) => {
        try {
          if (onAutoSaveRef.current) {
            await onAutoSaveRef.current(index, data, merged);
          }
        } catch (e) {
          console.error('Remote auto-save failed', e);
        }
      }, 800);
    }
    return null;
  }, [persistence?.storageType]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (remoteSave) {
        remoteSave.cancel();
      }
    };
  }, [remoteSave]);

  const triggerPersistence = useCallback(async (stepIdx: number, data: any, merged: any, completedOverride?: Record<number, boolean>) => {
    if (!formKey) return;

    const stepsToSave = completedOverride || completedSteps;

    // 1. AsyncStorage Persistence
    if (persistence?.asyncStorage) {
      try {
        const serializedData = await serializeFiles(merged);
        await persistence.asyncStorage.setItem(`form-steps-draft:${formKey}`, JSON.stringify({
          stepIndex: stepIdx,
          mergedData: serializedData,
          completedSteps: stepsToSave,
          savedAt: Date.now(),
        }));
      } catch (e) {
        console.warn('AsyncStorage draft save failed:', e);
      }
    }

    // 2. Browser Storage Persistence
    if (persistence?.storageType === 'localStorage' || persistence?.storageType === 'sessionStorage') {
      try {
        const serializedData = await serializeFiles(merged);
        browserStoragePersistence.save(formKey, {
          stepIndex: stepIdx,
          mergedData: serializedData,
          completedSteps: stepsToSave,
          savedAt: Date.now(),
        }, persistence.storageType);
      } catch (e) {
        console.warn('Browser storage draft save failed:', e);
      }
    }

    if (remoteSave) {
      remoteSave(stepIdx, data, merged);
    }
  }, [formKey, persistence, remoteSave, completedSteps]);

  // Analytics Callbacks
  useEffect(() => {
    if (onStepEnter) onStepEnter(currentStep);
  }, [currentStep, onStepEnter]);

  // Error Summary
  const getAllErrors = useCallback(() => {
    const errors: Record<number, any> = {};
    Object.keys(stepConfigs).forEach(idx => {
      const index = Number(idx);
      const schema = stepConfigs[index].schema;
      if (schema) {
        const result = schema.safeParse(mergedData);
        if (!result.success) {
          errors[index] = result.error.format();
        }
      }
    });
    return errors;
  }, [stepConfigs, mergedData]);

  const resumeDraft = useCallback((draft: DraftData) => {
    if (draft.mergedData) {
      setAllStepData({});
      const cleanData = deserializeFiles(draft.mergedData);
      setResumedDraftData(cleanData);
      setCurrentStep(draft.stepIndex);

      if (draft.completedSteps) {
        setCompletedSteps(draft.completedSteps);
      } else {
        const newCompleted: Record<number, boolean> = {};
        for (let i = 0; i < draft.stepIndex; i++) {
          newCompleted[i] = true;
        }
        setCompletedSteps(newCompleted);
      }
    }
  }, []);

  const clearDraft = useCallback(async () => {
    console.log('🧹 [clearDraft] Running... formKey:', formKey, 'persistence.asyncStorage exists:', !!persistence?.asyncStorage);

    // 1. Clear Browser Storage
    if (formKey) {
      try {
        console.log('🧹 [clearDraft] Clearing browser local/session storage...');
        browserStoragePersistence.clear(formKey, 'localStorage');
        browserStoragePersistence.clear(formKey, 'sessionStorage');
      } catch (e) {
        console.warn('🧹 [clearDraft] Browser storage clear failed:', e);
      }
    }

    // 1.5 Clear AsyncStorage
    if (formKey && persistence?.asyncStorage) {
      try {
        console.log('📱 [clearDraft] Removing AsyncStorage key:', `form-steps-draft:${formKey}`);
        await persistence.asyncStorage.removeItem(`form-steps-draft:${formKey}`);
        console.log('📱 [clearDraft] AsyncStorage key removed successfully!');
      } catch (e) {
        console.warn('📱 [clearDraft] AsyncStorage clear failed:', e);
      }
    } else {
      console.log('📱 [clearDraft] Skipping AsyncStorage clear. formKey:', formKey, 'hasAsyncStorage:', !!persistence?.asyncStorage);
    }

    // 2. Clear Database/Remote Storage
    if (persistence?.onClearDraft) {
      console.log('☁️ Calling remote clearDraft callback...');
      await persistence.onClearDraft();
    }

    // 3. Clear Internal State
    setAllStepData({});
    setResumedDraftData(null);
    setCompletedSteps({});
    setCurrentStep(0);

    // 4. Sync with external state (Redux)
    if (onDataChange) {
      onDataChange({});
    }

    // 5. Notify Parent UI
    if (onClear) {
      console.log('🧹 [clearDraft] Calling onClear callback...');
      onClear();
    }
    console.log('🧹 [clearDraft] Finished clearDraft execution!');
  }, [formKey, persistence, onDataChange, onClear]);

  // Navigation
  const goNext = useCallback(async () => {
    const isLastStep = currentStep === steps.length - 1;
    console.log('👉 [goNext] Triggered! currentStep:', currentStep, 'steps.length:', steps.length, 'isLastStep:', isLastStep);

    // Mark current as complete
    const nextCompleted = { ...completedSteps, [currentStep]: true };
    setCompletedSteps(nextCompleted);
    if (onStepComplete) onStepComplete(currentStep);

    // Auto-save logic: Don't save draft if it's the last step (we're about to clear it)
    if (!isLastStep) {
      const currentData = allStepData[currentStep] || {};
      console.log('👉 [goNext] Saving step draft for index:', currentStep + 1);
      // We pass nextCompleted here to ensure the save includes the step we just finished!
      await triggerPersistence(currentStep + 1, currentData, mergedData, nextCompleted);
    }

    if (isLastStep) {
      const errors = getAllErrors();
      if (Object.keys(errors).length > 0) {
        console.warn('Cannot submit form: validation errors found in steps', errors);
        const firstErrorStep = Object.keys(errors).map(Number).sort((a, b) => a - b)[0];
        setCurrentStep(firstErrorStep);
        return;
      }

      console.log('👉 [goNext] isLastStep is TRUE! Submitting form. Calling clearDraft()...');
      setIsSubmitting(true);
      try {
        const diff = isEditMode ? getChangedFieldsMap(defaultValues, mergedData) : mergedData;
        // Immediately clear the draft before submitting to avoid unmount race conditions
        await clearDraft();
        console.log('👉 [goNext] clearDraft completed! Calling onSubmit callback...');
        await onSubmit(mergedData, diff);
        console.log('👉 [goNext] onSubmit callback completed successfully!');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log('👉 [goNext] Moving to next step:', currentStep + 1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length, allStepData, triggerPersistence, mergedData, isEditMode, defaultValues, onSubmit, formKey, persistence?.storageType, onStepComplete, getAllErrors, clearDraft, completedSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (!allowJump) return;

    if (unrestrictedNav || index < currentStep) {
      setCurrentStep(index);
    } else {
      let canJump = true;
      for (let i = 0; i < index; i++) {
        if (!completedSteps[i] && i !== currentStep) {
          canJump = false;
          break;
        }
      }
      if (canJump) {
        setCurrentStep(index);
      }
    }
  }, [allowJump, unrestrictedNav, currentStep, completedSteps]);


  const contextValue: FormStepsContextType = useMemo(() => ({
    values: mergedData,
    mergedData,
    resumedDraftData,
    currentStep,
    steps,
    isEditMode,
    changedFields,
    isSubmitting,
    goNext,
    goBack,
    goToStep,
    getAllErrors,
    registerStep,
    unregisterStep,
    updateStepData,
    resumeDraft,
    clearDraft,
  }), [
    mergedData,
    resumedDraftData,
    currentStep,
    steps,
    isEditMode,
    changedFields,
    isSubmitting,
    goNext,
    goBack,
    goToStep,
    getAllErrors,
    registerStep,
    unregisterStep,
    updateStepData,
    resumeDraft,
    clearDraft
  ]);

  return (
    <FormStepsContext.Provider value={contextValue}>
      {children}
    </FormStepsContext.Provider>
  );
};
