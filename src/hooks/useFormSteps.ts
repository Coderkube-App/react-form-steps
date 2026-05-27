import { useContext } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormStepsContext } from '../context/FormStepsContext';
import { FormStepsContextType } from '../types';

/**
 * Custom hook to access FormSteps context and internal form methods.
 * Must be used within a <Step> component to access form methods like register.
 */
export function useFormSteps(): FormStepsContextType & ReturnType<typeof useFormContext> {
  const context = useContext(FormStepsContext);
  const formMethods = useFormContext();

  if (!context) {
    throw new Error('useFormSteps must be used within a <FormSteps> provider');
  }

  return { ...context, ...formMethods };
}
