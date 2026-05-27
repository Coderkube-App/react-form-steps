import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StepProps } from '../types';
import { useFormSteps } from '../hooks/useFormSteps';

export const Step: React.FC<StepProps> = ({ children, label, schema, index }) => {
  const { 
    mergedData, 
    currentStep, 
    resumedDraftData, 
    registerStep, 
    unregisterStep, 
    updateStepData, 
    goNext 
  } = useFormSteps();

  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: mergedData,
    mode: 'onTouched',
  });

  const { handleSubmit, watch, reset } = methods;

  // Sync form with mergedData when the step becomes active OR when a draft is resumed
  useEffect(() => {
    if (mergedData && Object.keys(mergedData).length > 0) {
      reset(mergedData, { keepDefaultValues: true });
    } else {
      reset({});
    }
  }, [currentStep, reset, resumedDraftData]);

  // Register step with context
  useEffect(() => {
    if (typeof index === 'number') {
      registerStep(index, label, schema);
      return () => unregisterStep(index);
    }
  }, [index, label, schema, registerStep, unregisterStep]);

  // Update context data when fields change
  useEffect(() => {
    const subscription = watch((value) => {
      if (typeof index === 'number') {
        updateStepData(index, value);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, index, updateStepData]);


  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={handleSubmit(async () => {
          await goNext();
        })}
        id={`step-form-${index}`}
        className="form-step-container"
      >
        {children}
      </form>
    </FormProvider>
  );
};
