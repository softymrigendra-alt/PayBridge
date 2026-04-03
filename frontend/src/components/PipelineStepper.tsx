import { OpportunityStatus } from '../types';

interface Step {
  key: string;
  label: string;
  description: string;
  statuses: OpportunityStatus[];
}

const STEPS: Step[] = [
  {
    key: 'sf',
    label: 'Salesforce Data',
    description: 'Opportunity synced from Salesforce CRM',
    statuses: ['PENDING', 'INVOICE_FETCHED', 'INVITE_SENT', 'ONBOARDING_COMPLETE', 'PAYMENT_PENDING', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED'],
  },
  {
    key: 'ns',
    label: 'NetSuite Invoice',
    description: 'Invoice matched and fetched from NetSuite ERP',
    statuses: ['INVOICE_FETCHED', 'INVITE_SENT', 'ONBOARDING_COMPLETE', 'PAYMENT_PENDING', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED'],
  },
  {
    key: 'onboard',
    label: 'Host Registration',
    description: 'Host completed Stripe Connect onboarding',
    statuses: ['ONBOARDING_COMPLETE', 'PAYMENT_PENDING', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED'],
  },
  {
    key: 'payment',
    label: 'Payment',
    description: 'Payment collected via Stripe',
    statuses: ['PAYMENT_SUCCEEDED'],
  },
];

type StepState = 'complete' | 'current' | 'pending' | 'error';

function getStepState(step: Step, currentStatus: OpportunityStatus): StepState {
  if (currentStatus === 'ERROR') return 'error';
  if (step.statuses.includes(currentStatus)) return 'complete';
  const stepIndex = STEPS.indexOf(step);
  const currentStep = STEPS.findIndex((s) => s.statuses.includes(currentStatus));
  if (stepIndex === currentStep + 1) return 'current';
  return 'pending';
}

export function PipelineStepper({ status }: { status: OpportunityStatus }) {
  return (
    <div className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const state = getStepState(step, status);
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className={`flex-1 h-0.5 ${
                    state === 'complete' ? 'bg-brand-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-sm font-bold transition-all ${
                  state === 'complete'
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : state === 'current'
                    ? 'border-brand-500 text-brand-500 bg-brand-50'
                    : state === 'error'
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-gray-200 text-gray-400 bg-white'
                }`}
              >
                {state === 'complete' ? '✓' : state === 'error' ? '!' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    STEPS[i + 1] && getStepState(STEPS[i + 1], status) !== 'pending'
                      ? 'bg-brand-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="mt-2 text-center px-1">
              <p className={`text-xs font-semibold ${
                state === 'complete' ? 'text-brand-600' :
                state === 'current' ? 'text-brand-500' :
                state === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight hidden sm:block">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
