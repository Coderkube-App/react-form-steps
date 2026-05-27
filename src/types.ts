import { ReactNode } from 'react';

export type StepStatus = 'pending' | 'active' | 'complete' | 'error';

export interface StepInfo {
  index: number;
  label: string;
  status: StepStatus;
}

export interface PersistenceOptions {
  storageType: 'localStorage' | 'sessionStorage' | 'database' | 'none';
  formKey?: string;
  draftTTL?: number; // in seconds
  onAutoSave?: (stepIndex: number, stepData: any, mergedData: any) => Promise<void>;
  onClearDraft?: () => Promise<void> | void; // New: DB clearing support
  asyncStorage?: {
    getItem: (key: string) => any;
    setItem: (key: string, value: string) => any;
    removeItem: (key: string) => any;
  };
}

export interface FormStepsContextType {
  values: any;
  mergedData: any;
  resumedDraftData: any;
  currentStep: number;
  steps: StepInfo[];
  isEditMode: boolean;
  changedFields: Record<string, boolean>;
  isSubmitting: boolean;
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (index: number) => void;
  getAllErrors: () => Record<number, any>; // New: Get validation errors for all steps
  registerStep: (index: number, label: string, schema?: any) => void;
  unregisterStep: (index: number) => void;
  updateStepData: (index: number, data: any) => void;
  resumeDraft: (draft: any) => void;
  clearDraft: () => void;
}

export interface FormStepsProps {
  children: ReactNode;
  formKey?: string;
  storageStrategy?: 'localStorage' | 'sessionStorage' | 'database' | 'none';
  asyncStorage?: {
    getItem: (key: string) => any;
    setItem: (key: string, value: string) => any;
    removeItem: (key: string) => any;
  };
  onAutoSave?: (i: number, data: any, merged: any) => Promise<void>;
  onDataChange?: (data: any) => void; // For syncing with Redux etc.
  onClearDraft?: () => Promise<void> | void; // New: DB clearing
  defaultValues?: any;
  onSubmit: (payload: any, diff: any) => void | Promise<void>;
  onDraftFound?: (draft: any) => void;
  draftTTL?: number;
  Autofilldata?: boolean; // Automatic draft loading
  allowJump?: boolean; // Allow non-linear navigation
  unrestrictedNav?: boolean; // Allow jumping even if previous steps are not complete
  transition?: 'slide' | 'fade' | 'none'; // New: Transition effect
  onStepEnter?: (index: number) => void; // New: Analytics
  onStepComplete?: (index: number) => void; // New: Analytics
  bannerConfig?: {
    title?: string;
    description?: string;
    resumeLabel?: string;
    freshLabel?: string;
    className?: string;
    style?: any;
  };
  renderDraftBanner?: (props: { 
    draft: DraftData; 
    resume: () => void; 
    startFresh: () => void; 
    dismiss: () => void; 
  }) => ReactNode;
}

export interface StepProps {
  children: ReactNode;
  label: string;
  schema?: any;
  index?: number; // Injected by FormSteps
}

export interface DraftData {
  stepIndex: number;
  mergedData: any;
  completedSteps: Record<number, boolean>;
  savedAt: number;
}
