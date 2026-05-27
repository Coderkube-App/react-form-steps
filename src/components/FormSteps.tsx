import React, { useState, useEffect, useContext } from 'react';
import { FormStepsProvider, FormStepsContext } from '../context/FormStepsContext';
import { FormStepsProps, DraftData } from '../types';
import { browserStoragePersistence } from '../persistence/browserStorage';
import { DraftBanner } from './DraftBanner';

interface InnerContentProps {
  children: React.ReactNode;
  showBanner: boolean;
  draft: DraftData | null;
  setShowBanner: (val: boolean) => void;
  setDraft: (val: DraftData | null) => void;
  bannerConfig?: any;
  renderDraftBanner?: any;
  transition?: 'slide' | 'fade' | 'none';
}

const InnerContent: React.FC<InnerContentProps & { Autofilldata?: boolean }> = ({
  children,
  showBanner,
  draft,
  setShowBanner,
  setDraft,
  bannerConfig,
  Autofilldata,
  renderDraftBanner,
  transition = 'none'
}) => {
  const context = useContext(FormStepsContext);
  const contextResume = context?.resumeDraft;

  useEffect(() => {
    if (Autofilldata && draft && contextResume) {
      contextResume(draft);
      setShowBanner(false);
    }
  }, [Autofilldata, draft, contextResume, setShowBanner]);

  if (!context) return <>{children}</>;

  const { resumeDraft, clearDraft, currentStep } = context;

  const handleResume = () => {
    if (draft && resumeDraft) {
      resumeDraft(draft);
      setShowBanner(false);
    }
  };

  const handleFresh = () => {
    clearDraft();
    setShowBanner(false);
    setDraft(null);
  };

  const handleDismiss = () => setShowBanner(false);

  return (
    <>
      <style>{`
        .step-transition-wrapper {
          position: relative;
          width: 100%;
        }
        .step-container {
          width: 100%;
        }
        .step-transition-fade .step-active {
          animation: formStepsFadeIn 0.4s ease-out;
        }
        .step-transition-slide .step-active {
          animation: formStepsSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes formStepsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes formStepsSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {showBanner && draft && !Autofilldata && (
        renderDraftBanner ? (
          renderDraftBanner({ draft, resume: handleResume, startFresh: handleFresh, dismiss: handleDismiss })
        ) : (
          <DraftBanner
            {...bannerConfig}
            onResume={handleResume}
            onFresh={handleFresh}
            onDismiss={handleDismiss}
          />
        )
      )}
      <div className={`form-steps-wrapper step-transition-wrapper step-transition-${transition}`}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return child;

          const childProps = child.props as any;

          // If it's a Step (has an index), wrap it and handle visibility
          if (childProps.hasOwnProperty('index')) {
            const isActive = childProps.index === currentStep;
            return (
              <div
                className={`step-container ${isActive ? 'step-active' : 'step-hidden'}`}
                style={{ display: isActive ? 'block' : 'none' }}
              >
                {child}
              </div>
            );
          }

          // Persistent UI (like sidebar) stays visible
          return child;
        })}
      </div>
    </>
  );
};

export const FormSteps: React.FC<FormStepsProps> = (props) => {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isBrowserStorage = props.storageStrategy === 'localStorage' || props.storageStrategy === 'sessionStorage';

    if (props.formKey && isBrowserStorage) {
      const savedDraft = browserStoragePersistence.load(
        props.formKey,
        props.storageStrategy as 'localStorage' | 'sessionStorage',
        props.draftTTL
      );
      if (savedDraft) {
        setDraft(savedDraft);
        setShowBanner(true);
        if (props.onDraftFound) props.onDraftFound(savedDraft);
      }
    }
  }, [props.formKey, props.storageStrategy, props.draftTTL, props.onDraftFound]);

  // Load from custom asyncStorage asynchronously
  useEffect(() => {
    const loadAsyncDraft = async () => {
      if (props.formKey && props.asyncStorage) {
        try {
          const raw = await props.asyncStorage.getItem(`form-steps-draft:${props.formKey}`);
          if (raw) {
            const savedDraft: DraftData = JSON.parse(raw);
            if (props.draftTTL) {
              const now = Date.now();
              const expired = now - savedDraft.savedAt > props.draftTTL * 1000;
              if (expired) {
                await props.asyncStorage.removeItem(`form-steps-draft:${props.formKey}`);
                return;
              }
            }
            setDraft(savedDraft);
            setShowBanner(true);
            if (props.onDraftFound) props.onDraftFound(savedDraft);
          }
        } catch (e) {
          console.error('Failed to load async draft', e);
        }
      }
    };
    loadAsyncDraft();
  }, [props.formKey, props.asyncStorage, props.draftTTL, props.onDraftFound]);

  // Calculate active index manually
  let stepCounter = 0;
  const childrenWithFixedIndex = React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      // Check if it's a Step component (has label prop)
      if (child.props.label && !child.props.hasOwnProperty('index')) {
        return React.cloneElement(child as React.ReactElement<any>, { index: stepCounter++ });
      }
    }
    return child;
  });

  return (
    <FormStepsProvider
      formKey={props.formKey}
      persistence={{
        storageType: props.storageStrategy || 'none',
        formKey: props.formKey,
        onAutoSave: props.onAutoSave,
        onClearDraft: props.onClearDraft,
        draftTTL: props.draftTTL,
        asyncStorage: props.asyncStorage
      }}
      allowJump={props.allowJump}
      unrestrictedNav={props.unrestrictedNav}
      onStepEnter={props.onStepEnter}
      onStepComplete={props.onStepComplete}
      onDataChange={props.onDataChange}
      onClear={() => {
        setDraft(null);
        setShowBanner(false);
      }}
      defaultValues={props.defaultValues}
      onSubmit={props.onSubmit}
    >
      <InnerContent
        showBanner={showBanner}
        draft={draft}
        setShowBanner={setShowBanner}
        setDraft={setDraft}
        bannerConfig={props.bannerConfig}
        Autofilldata={props.Autofilldata}
        renderDraftBanner={props.renderDraftBanner}
        transition={props.transition}
      >
        {childrenWithFixedIndex}
      </InnerContent>
    </FormStepsProvider>
  );
};
