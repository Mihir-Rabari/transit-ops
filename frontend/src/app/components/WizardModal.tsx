import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  steps: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  error: string | null;
  isSubmitting?: boolean;
  canProceed: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}

export default function WizardModal({
  open,
  onClose,
  title,
  icon,
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  error,
  isSubmitting = false,
  canProceed,
  submitLabel = 'Submit',
  children,
}: WizardModalProps) {
  if (!open) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg ops-panel p-6 relative flex flex-col max-h-[90vh]"
        style={{ borderRadius: 8 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 mb-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h3
            className="font-bold font-display flex items-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-6 flex-wrap">
          {steps.map((label, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono"
                    style={{
                      background: isActive
                        ? 'var(--color-signal-amber)'
                        : isCompleted
                        ? 'var(--color-signal-green)'
                        : 'var(--color-surface-raised)',
                      color: isActive || isCompleted ? 'var(--color-base)' : 'var(--color-text-muted)',
                    }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline"
                    style={{
                      color: isActive
                        ? 'var(--color-text-primary)'
                        : isCompleted
                        ? 'var(--color-signal-green)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="w-4 h-px mx-1"
                    style={{
                      background:
                        idx < currentStep
                          ? 'var(--color-signal-amber)'
                          : 'var(--color-border)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[120px]">
          {children}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="mt-3 rounded p-3 text-xs font-semibold"
            style={{
              background: 'rgba(255, 92, 92, 0.1)',
              color: 'var(--color-signal-red)',
              border: '1px solid rgba(255, 92, 92, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* Footer Navigation */}
        <div
          className="flex items-center justify-between pt-4 mt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={isFirst || isSubmitting}
            className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canProceed || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-r-transparent" style={{ borderColor: 'var(--color-text-primary)' }} />
                  Saving...
                </>
              ) : (
                <>
                  {submitLabel}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStepChange(currentStep + 1)}
              disabled={!canProceed || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
