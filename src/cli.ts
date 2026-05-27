import readline from 'readline';
import fs from 'fs';
import path from 'path';

// ANSI terminal colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

const BANNER = `
${CYAN}${BOLD}  ███████╗ ██████╗ ██████╗ ███╗   ███╗      ███████╗████████╗███████╗██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗████╗ ████║      ██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔════╝
  █████╗  ██║   ██║██████╔╝██╔████╔██║█████╗███████╗   ██║   █████╗  ██████╔╝███████╗
  ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║╚════╝╚════██║   ██║   ██╔══╝  ██╔═══╝ ╚════██║
  ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║      ███████║   ██║   ███████╗██║     ███████║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝      ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚══════╝${RESET}

         ${YELLOW}🚀 Generate customizable multi-step wizard forms in seconds!${RESET}
         ${GREEN}✨ Choose a platform, language, form type, and field structure.${RESET}
`;

// Unified interactive selection with arrow keys
function selectOption(query: string, options: string[], initialIndex = 0): Promise<number> {
  return new Promise((resolve) => {
    let cursor = initialIndex;

    const render = () => {
      process.stdout.write(`\x1b[1m${query}\x1b[22m\n`);
      options.forEach((opt, idx) => {
        if (idx === cursor) {
          process.stdout.write(`  ${CYAN}${BOLD}❯ ${opt}${RESET}\n`);
        } else {
          process.stdout.write(`    ${opt}\n`);
        }
      });
    };

    const clear = () => {
      // Clear lines rendered by the options block (options length + 1 query line)
      for (let i = 0; i < options.length + 1; i++) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
      }
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    render();

    const onKeypress = (_str: string, key: any) => {
      if (key && key.ctrl && key.name === 'c') {
        process.exit();
      }
      if (key) {
        if (key.name === 'up') {
          clear();
          cursor = (cursor - 1 + options.length) % options.length;
          render();
        } else if (key.name === 'down') {
          clear();
          cursor = (cursor + 1) % options.length;
          render();
        } else if (key.name === 'return' || key.name === 'enter') {
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          process.stdin.removeListener('keypress', onKeypress);

          clear();
          // Print final selection static line
          process.stdout.write(`\x1b[1m${query}\x1b[22m ${GREEN}${options[cursor]}${RESET}\n`);
          resolve(cursor);
        }
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

// Unified text input reader for steps and fields
function readInput(query: string, defaultValue: string = ''): Promise<string> {
  return new Promise((resolve) => {
    let inputVal = '';
    const promptLabel = `${BOLD}${query}${RESET}${defaultValue ? ` (default: ${defaultValue})` : ''}: `;
    process.stdout.write(promptLabel);

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    const onKeypress = (str: string, key: any) => {
      if (key && key.ctrl && key.name === 'c') {
        process.exit();
      }
      if (key) {
        if (key.name === 'return' || key.name === 'enter') {
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          process.stdin.removeListener('keypress', onKeypress);
          process.stdout.write('\n');
          resolve(inputVal.trim() === '' ? defaultValue : inputVal.trim());
        } else if (key.name === 'backspace') {
          if (inputVal.length > 0) {
            inputVal = inputVal.slice(0, -1);
            readline.moveCursor(process.stdout, -1, 0);
            readline.clearLine(process.stdout, 1);
          }
        } else if (str && str.length === 1 && !key.ctrl && !key.meta) {
          inputVal += str;
          process.stdout.write(str);
        }
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function promptInteger(query: string, min: number, max: number, defaultValue: number): Promise<number> {
  while (true) {
    const ans = await readInput(query, String(defaultValue));
    const val = parseInt(ans, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      return val;
    }
    console.log(`${RED}Invalid entry. Please input a number between ${min} and ${max}.${RESET}`);
  }
}

async function main() {
  console.clear();
  console.log(BANNER);

  // 1. Platform Selection
  const platformIdx = await selectOption('Select Platform Structure:', [
    'Web (React)',
    'React Native (Mobile)',
    'None (Cancel)'
  ], 0);

  if (platformIdx === 2) {
    console.log(`\n${YELLOW}Operation cancelled. Exiting generator.${RESET}`);
    process.exit(0);
  }

  const isWeb = platformIdx === 0;

  // 2. Language Selection
  const langIdx = await selectOption('Select Programming Language:', [
    'JavaScript (.js / .jsx)',
    'TypeScript (.ts / .tsx)'
  ], 1);

  const isTS = langIdx === 1;

  // 3. Rendering Style (Popup/Modal vs Normal Inline)
  const renderIdx = await selectOption('Select Form Rendering Style:', [
    'Normal Inline Page Component',
    'Popup / Modal Overlay Component'
  ], 0);

  const isPopup = renderIdx === 1;

  // 4. State Management (Normal vs Redux)
  const stateIdx = await selectOption('Select Form State Strategy:', [
    'Normal (React Hook Form)',
    'Redux (React Hook Form + Redux Toolkit)'
  ], 0);

  const isRedux = stateIdx === 1;

  // 5. Steps and Fields
  const stepCount = await promptInteger('How many steps do you want in the wizard?', 1, 10, 3);
  const fieldsCount = await promptInteger('How many input fields do you want per step?', 1, 10, 2);
  const fieldsPerStep: number[] = Array(stepCount).fill(fieldsCount);

  // Confirm target folder
  const targetDir = path.join(process.cwd(), 'form-steps');
  if (fs.existsSync(targetDir)) {
    const confirmOverwrite = await readInput(`\n${RED}${BOLD}Warning:${RESET} Directory 'form-steps' already exists. Overwrite? (y/n) [default: n]`, 'n');
    if (confirmOverwrite.toLowerCase().trim() !== 'y') {
      console.log(`\n${YELLOW}Operation aborted. Folder preserved.${RESET}`);
      process.exit(0);
    }
    // Delete existing
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Create Directories
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`\n${GREEN}⏳ Generating form-steps scaffolding...${RESET}`);

  // Generate Files
  const ext = isTS ? 'ts' : 'js';
  const jsxExt = isTS ? 'tsx' : 'jsx';

  // Helper function to create shebang or normal header comment
  const headerComment = `/**
 * Generated by react-form-steps CLI
 * Configuration:
 * - Platform: ${isWeb ? 'Web' : 'React Native'}
 * - Language: ${isTS ? 'TypeScript' : 'JavaScript'}
 * - Style: ${isPopup ? 'Popup Modal' : 'Inline Page'}
 * - State: ${isRedux ? 'Redux Toolkit' : 'Local Hook Form'}
 */
`;

  // 1. Generate CSS/Stylesheets for Web
  if (isWeb) {
    const cssContent = `/* form-steps.css - Generated wizard styles */
:root {
  --f-primary: #3b82f6;
  --f-primary-hover: #2563eb;
  --f-success: #10b981;
  --f-danger: #ef4444;
  --f-bg-main: #f8fafc;
  --f-card-bg: #ffffff;
  --f-text-main: #1e293b;
  --f-text-muted: #64748b;
  --f-border: #cbd5e1;
  --f-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.f-wizard-container {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 600px;
  margin: 20px auto;
  padding: 24px;
  background: var(--f-card-bg);
  border-radius: 12px;
  box-shadow: var(--f-shadow);
  color: var(--f-text-main);
}

.f-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.f-modal-content {
  background: var(--f-card-bg);
  width: 90%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow: var(--f-shadow);
  padding: 24px;
  position: relative;
}

.f-close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--f-text-muted);
  cursor: pointer;
}

.f-step-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--f-text-main);
}

.f-step-subtitle {
  font-size: 14px;
  color: var(--f-text-muted);
  margin-bottom: 20px;
}

.f-input-group {
  margin-bottom: 16px;
}

.f-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--f-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.f-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--f-border);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.f-input:focus {
  outline: none;
  border-color: var(--f-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.f-input-error {
  border-color: var(--f-danger);
}

.f-error-text {
  color: var(--f-danger);
  font-size: 12px;
  margin-top: 4px;
}

.f-button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.f-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.f-btn-primary {
  background: var(--f-primary);
  color: #fff;
}

.f-btn-primary:hover {
  background: var(--f-primary-hover);
}

.f-btn-secondary {
  background: transparent;
  color: var(--f-text-muted);
  border: 1px solid var(--f-border);
}

.f-btn-secondary:hover {
  background: var(--f-bg-main);
}

.f-trigger-btn {
  padding: 12px 24px;
  background: var(--f-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--f-shadow);
}

/* Timeline/Header styles */
.f-timeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.f-timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.f-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px solid var(--f-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  color: var(--f-text-muted);
}

.f-circle-active {
  background: var(--f-primary);
  border-color: var(--f-primary);
  color: #fff;
}

.f-circle-complete {
  background: var(--f-success);
  border-color: var(--f-success);
  color: #fff;
}

.f-step-label {
  font-size: 11px;
  margin-top: 4px;
  font-weight: 500;
  color: var(--f-text-muted);
}
`;
    fs.writeFileSync(path.join(targetDir, 'form-steps.css'), cssContent);
  }

  // 2. Generate Redux Slice if Redux is selected
  if (isRedux) {
    const sliceName = `formSlice.${ext}`;
    const reduxContent = `${headerComment}
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: {},
};

export const formSlice = createSlice({
  name: 'multistepForm',
  initialState,
  reducers: {
    updateFormData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    resetForm: (state) => {
      state.data = {};
    },
  },
});

export const { updateFormData, resetForm } = formSlice.actions;

export default formSlice.reducer;
`;
    fs.writeFileSync(path.join(targetDir, sliceName), reduxContent);
  }

  // 3. Generate Step Components
  for (let sIdx = 1; sIdx <= stepCount; sIdx++) {
    const stepName = `Step${sIdx}.${jsxExt}`;
    const fieldCount = fieldsPerStep[sIdx - 1];

    let stepContent = '';
    if (isWeb) {
      // Web JSX/TSX
      stepContent = `${headerComment}
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useFormSteps } from 'react-form-steps';

export const Step${sIdx} = () => {
  const { register, formState: { errors } } = useFormContext();
  const { goBack, goNext } = useFormSteps();

  return (
    <div>
      <h3 className="f-step-title">Step ${sIdx}</h3>
      <p className="f-step-subtitle">Provide details for step ${sIdx}.</p>

      ${Array.from({ length: fieldCount }).map((_, fIdx) => `
      <div className="f-input-group">
        <label className="f-label">Example Field ${fIdx + 1}</label>
        <input
          type="text"
          className={\`f-input \${errors.field_${sIdx}_${fIdx + 1} ? 'f-input-error' : ''}\`}
          placeholder="Enter value..."
          {...register('field_${sIdx}_${fIdx + 1}', { required: 'This field is required' })}
        />
        {errors.field_${sIdx}_${fIdx + 1} && (
          <span className="f-error-text">{errors.field_${sIdx}_${fIdx + 1}.message}</span>
        )}
      </div>`).join('')}

      <div className="f-button-group">
        ${sIdx > 1 ? `<button type="button" className="f-btn f-btn-secondary" onClick={goBack}>Back</button>` : ''}
        <button type="submit" className="f-btn f-btn-primary">
          ${sIdx === stepCount ? 'Submit Form' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default Step${sIdx};
`;
    } else {
      // React Native Components
      stepContent = `${headerComment}
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { useFormSteps } from 'react-form-steps';

export const Step${sIdx} = () => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const { goBack, goNext } = useFormSteps();

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step ${sIdx}</Text>
      <Text style={styles.stepSubtitle}>Provide details for step ${sIdx}.</Text>

      ${Array.from({ length: fieldCount }).map((_, fIdx) => `
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Example Field ${fIdx + 1}</Text>
        <TextInput
          style={[styles.input, errors.field_${sIdx}_${fIdx + 1} && styles.inputError]}
          placeholder="Enter value..."
          placeholderTextColor="#94a3b8"
          value={watch('field_${sIdx}_${fIdx + 1}') || ''}
          onChangeText={(val) => setValue('field_${sIdx}_${fIdx + 1}', val, { shouldValidate: true })}
        />
        {errors.field_${sIdx}_${fIdx + 1} && (
          <Text style={styles.errorText}>{errors.field_${sIdx}_${fIdx + 1}.message}</Text>
        )}
      </View>`).join('')}

      <View style={styles.buttonGroup}>
        ${sIdx > 1 ? `
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={goBack}>
          <Text style={styles.btnSecondaryText}>Back</Text>
        </TouchableOpacity>` : ''}
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={goNext}>
          <Text style={styles.btnPrimaryText}>
            ${sIdx === stepCount ? 'Submit Form' : 'Next Step'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 20,
  },
  btnSecondaryText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Step${sIdx};
`;
    }

    fs.writeFileSync(path.join(targetDir, stepName), stepContent);
  }

  // 4. Generate Master Component / Screen (FormStepsWizard)
  const wizardName = `FormStepsWizard.${jsxExt}`;
  let wizardContent = '';

  if (isWeb) {
    // Web JSX/TSX Wizard content
    wizardContent = `${headerComment}
import React, { useState } from 'react';
import { FormSteps, Step } from 'react-form-steps';
import './form-steps.css';
${isRedux ? `import { useDispatch } from 'react-redux';\nimport { updateFormData } from './formSlice';\n` : ''}
${Array.from({ length: stepCount }).map((_, idx) => `import Step${idx + 1} from './Step${idx + 1}';\n`).join('')}

export const FormStepsWizard = () => {
  ${isPopup ? `const [isOpen, setIsOpen] = useState(false);\n` : ''}
  ${isRedux ? `const dispatch = useDispatch();\n` : ''}

  const handleSubmit = (data${isTS ? ': any' : ''}) => {
    console.log('Form Submitted successfully:', data);
    ${isRedux ? `dispatch(updateFormData(data));\n` : ''}
    alert('Form submitted! Open dev logs for data payload.');
    ${isPopup ? `setIsOpen(false);\n` : ''}
  };

  const renderWizard = () => (
    <FormSteps
      formKey="react-wizard-scaffold"
      storageStrategy="localStorage"
      onSubmit={handleSubmit}
      allowJump={true}
      transition="fade"
    >
      ${Array.from({ length: stepCount }).map((_, idx) => `
      <Step label="Step ${idx + 1}">
        <Step${idx + 1} />
      </Step>`).join('')}
    </FormSteps>
  );

  ${isPopup ? `
  return (
    <div>
      <button className="f-trigger-btn" onClick={() => setIsOpen(true)}>
        Open Multi-step Form
      </button>

      {isOpen && (
        <div className="f-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="f-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="f-close-button" onClick={() => setIsOpen(false)}>&times;</button>
            {renderWizard()}
          </div>
        </div>
      )}
    </div>
  );\n` : `
  return (
    <div className="f-wizard-container">
      {renderWizard()}
    </div>
  );\n`}
};

export default FormStepsWizard;
`;
  } else {
    // React Native Wizard content
    wizardContent = `${headerComment}
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormSteps, Step } from 'react-form-steps';
${isRedux ? `import { useDispatch } from 'react-redux';\nimport { updateFormData } from './formSlice';\n` : ''}
${Array.from({ length: stepCount }).map((_, idx) => `import Step${idx + 1} from './Step${idx + 1}';\n`).join('')}

export const FormStepsWizard = () => {
  ${isPopup ? `const [isOpen, setIsOpen] = useState(false);\n` : ''}
  ${isRedux ? `const dispatch = useDispatch();\n` : ''}

  const handleSubmit = (data${isTS ? ': any' : ''}) => {
    console.log('Form Submitted successfully:', data);
    ${isRedux ? `dispatch(updateFormData(data));\n` : ''}
    ${isPopup ? `setIsOpen(false);\n` : ''}
  };

  const renderWizard = () => (
    <FormSteps
      formKey="native-wizard-scaffold"
      asyncStorage={AsyncStorage}
      onSubmit={handleSubmit}
      allowJump={true}
      transition="slide"
    >
      ${Array.from({ length: stepCount }).map((_, idx) => `
      <Step label="Step ${idx + 1}">
        <Step${idx + 1} />
      </Step>`).join('')}
    </FormSteps>
  );

  ${isPopup ? `
  return (
    <View style={styles.centerContainer}>
      <TouchableOpacity style={styles.triggerButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.triggerButtonText}>Open Multi-step Form</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Multi-Step Wizard</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {renderWizard()}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );\n` : `
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderWizard()}
      </ScrollView>
    </SafeAreaView>
  );\n`}
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  triggerButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  triggerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  scrollContainer: {
    paddingBottom: 24,
  },
});

export default FormStepsWizard;
`;
  }

  fs.writeFileSync(path.join(targetDir, wizardName), wizardContent);

  // 5. Generate index exporter file (index.js/ts)
  const indexContent = `${headerComment}
export { default as FormStepsWizard } from './FormStepsWizard';
${Array.from({ length: stepCount }).map((_, idx) => `export { default as Step${idx + 1} } from './Step${idx + 1}';\n`).join('')}
`;
  fs.writeFileSync(path.join(targetDir, `index.${ext}`), indexContent);

  console.log(`\n${GREEN}✔ Scaffolding created successfully inside folder: ./form-steps !${RESET}`);
  console.log(`\n${BOLD}Next steps to render: ${RESET}`);
  if (isWeb) {
    console.log(`  Import and render it in your App Component:`);
    console.log(`  ${CYAN}import { FormStepsWizard } from './form-steps';${RESET}`);
  } else {
    console.log(`  Import and render it in your App Screen:`);
    console.log(`  ${CYAN}import { FormStepsWizard } from './form-steps';${RESET}`);
  }

  console.log(`\n${GREEN}Enjoy using react-form-steps CLI! 🎉\n${RESET}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`${RED}Error during scaffolding generation:${RESET}`, err);
  process.exit(1);
});
