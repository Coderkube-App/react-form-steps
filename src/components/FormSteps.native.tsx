import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Animated } from 'react-native';
import { FormStepsProvider, FormStepsContext } from '../context/FormStepsContext';
import { FormStepsProps, DraftData } from '../types';
import { DraftBanner } from './DraftBanner.native';

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

  // Transitions using React Native Animated API
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (transition === 'none') return;

    if (transition === 'fade') {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else if (transition === 'slide') {
      slideAnim.setValue(25);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep, transition, fadeAnim, slideAnim]);

  const animatedStyle = transition === 'none' ? {} : {
    opacity: fadeAnim,
    transform: transition === 'slide' ? [{ translateX: slideAnim }] : [],
  };

  return (
    <View style={{ flex: 1 }}>
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
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null;

          const childProps = child.props as any;

          // If it's a Step (has an index), wrap it and handrle visibility
          if (childProps.hasOwnProperty('index')) {
            const isActive = childProps.index === currentStep;
            return (
              <View
                style={{ display: isActive ? 'flex' : 'none', flex: isActive ? 1 : 0 }}
              >
                {child}
              </View>
            );
          }

          // Persistent UI elements (like sidebar headers) stay visible
          return child;
        })}
      </Animated.View>
    </View>
  );
};

export const FormSteps: React.FC<FormStepsProps> = (props) => {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [showBanner, setShowBanner] = useState(false);

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
      return child;
    }
    return null;
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
