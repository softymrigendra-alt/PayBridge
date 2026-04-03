import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Step = 'welcome' | 'business' | 'banking' | 'verification' | 'complete';

const STEPS: Step[] = ['welcome', 'business', 'banking', 'verification', 'complete'];

function StripeLogoIcon() {
  return (
    <svg viewBox="0 0 60 25" className="h-8 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.7 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35V20h-4.09V5.57h3.79l.1 1.22c1-1.77 3.07-1.41 3.64-1.22v3.79c-.51-.17-2.36-.43-3.44.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.84zm-9.98 5.46c-1.82 0-3.06-.83-3.06-3.34V1.89L6.44 1v15.03c0 3.44 2.07 5.3 5.29 5.3.7 0 1.38-.08 2-.23V17.7c-.48.07-1.15.06-1.34.06z" fill="#635BFF"/>
    </svg>
  );
}

export default function DemoOnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return_url') ?? '/';

  const stepIndex = STEPS.indexOf(step);

  function next() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const nextStep = STEPS[stepIndex + 1];
      if (nextStep) setStep(nextStep);
    }, 800);
  }

  function finish() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigate(returnUrl);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Stripe header */}
      <header className="bg-white border-b border-[#e3e8ee] px-6 py-4 flex items-center justify-between">
        <StripeLogoIcon />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#697386] font-medium uppercase tracking-wide">Secure onboarding</span>
          <svg className="w-4 h-4 text-[#697386]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </header>

      {/* Progress bar */}
      {step !== 'complete' && (
        <div className="bg-white border-b border-[#e3e8ee]">
          <div className="max-w-lg mx-auto px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#697386]">Step {stepIndex + 1} of {STEPS.length - 1}</span>
              <span className="text-xs text-[#697386]">{Math.round((stepIndex / (STEPS.length - 1)) * 100)}% complete</span>
            </div>
            <div className="h-1.5 bg-[#e3e8ee] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#635bff] rounded-full transition-all duration-500"
                style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {step === 'welcome' && <WelcomeStep onNext={next} loading={submitting} />}
          {step === 'business' && <BusinessStep onNext={next} loading={submitting} />}
          {step === 'banking' && <BankingStep onNext={next} loading={submitting} />}
          {step === 'verification' && <VerificationStep onNext={next} loading={submitting} />}
          {step === 'complete' && <CompleteStep onFinish={finish} loading={submitting} />}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#697386] border-t border-[#e3e8ee] bg-white">
        Powered by{' '}
        <span className="font-semibold text-[#635bff]">Stripe</span>
        {' '}· Demo environment
      </footer>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e3e8ee] p-8">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#1a1f36] mb-1.5">{children}</label>;
}

function Input({ placeholder, type = 'text', defaultValue }: { placeholder?: string; type?: string; defaultValue?: string }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full px-3 py-2.5 border border-[#c1c9d2] rounded-md text-sm text-[#1a1f36] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent bg-white"
    />
  );
}

function Select({ children }: { children: React.ReactNode }) {
  return (
    <select className="w-full px-3 py-2.5 border border-[#c1c9d2] rounded-md text-sm text-[#1a1f36] focus:outline-none focus:ring-2 focus:ring-[#635bff] bg-white">
      {children}
    </select>
  );
}

function NextButton({ onClick, loading, label = 'Continue' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-[#635bff] hover:bg-[#5851db] disabled:opacity-70 text-white font-medium py-3 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : label}
    </button>
  );
}

function WelcomeStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  return (
    <Card>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#f0efff] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#635bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1a1f36] mb-2">Set up your account</h1>
        <p className="text-sm text-[#697386] leading-relaxed">
          To start accepting payments, we need to verify your business and collect bank account details. This takes about 5 minutes.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { icon: '🏢', title: 'Business details', desc: 'Legal name, address, and business type' },
          { icon: '🏦', title: 'Bank account', desc: 'Routing and account number for payouts' },
          { icon: '✅', title: 'Identity verification', desc: 'Government ID to confirm ownership' },
        ].map(item => (
          <div key={item.title} className="flex items-center gap-3 p-3 bg-[#f7f8fa] rounded-lg">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-sm font-medium text-[#1a1f36]">{item.title}</p>
              <p className="text-xs text-[#697386]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <NextButton onClick={onNext} loading={loading} label="Get started" />
      <p className="text-xs text-[#697386] text-center mt-3">Your data is encrypted and secured by Stripe</p>
    </Card>
  );
}

function BusinessStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-[#1a1f36] mb-6">Business information</h2>
      <div className="space-y-5">
        <div>
          <Label>Business type</Label>
          <Select>
            <option>LLC</option>
            <option>Corporation</option>
            <option>Sole proprietorship</option>
            <option>Partnership</option>
          </Select>
        </div>
        <div>
          <Label>Legal business name</Label>
          <Input placeholder="Acme Corp Inc." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>EIN / Tax ID</Label>
            <Input placeholder="XX-XXXXXXX" />
          </div>
          <div>
            <Label>Industry</Label>
            <Select>
              <option>Software / SaaS</option>
              <option>Retail</option>
              <option>Professional services</option>
              <option>Financial services</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Business address</Label>
          <Input placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label>City</Label>
            <Input placeholder="San Francisco" />
          </div>
          <div>
            <Label>State</Label>
            <Select>
              <option>CA</option><option>NY</option><option>TX</option><option>WA</option>
            </Select>
          </div>
          <div>
            <Label>ZIP</Label>
            <Input placeholder="94105" />
          </div>
        </div>
        <div>
          <Label>Business website</Label>
          <Input placeholder="https://acmecorp.com" type="url" />
        </div>
      </div>
      <div className="mt-8">
        <NextButton onClick={onNext} loading={loading} />
      </div>
    </Card>
  );
}

function BankingStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-[#1a1f36] mb-2">Bank account details</h2>
      <p className="text-sm text-[#697386] mb-6">Payouts will be deposited to this account.</p>
      <div className="space-y-5">
        <div>
          <Label>Account holder name</Label>
          <Input placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Routing number</Label>
          <Input placeholder="110000000" />
        </div>
        <div>
          <Label>Account number</Label>
          <Input placeholder="000123456789" type="password" />
        </div>
        <div>
          <Label>Confirm account number</Label>
          <Input placeholder="000123456789" type="password" />
        </div>
        <div>
          <Label>Account type</Label>
          <Select>
            <option>Checking</option>
            <option>Savings</option>
          </Select>
        </div>
      </div>
      <div className="mt-6 p-3 bg-[#f0efff] rounded-lg flex gap-2">
        <svg className="w-4 h-4 text-[#635bff] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs text-[#635bff]">Bank information is encrypted with 256-bit AES and transmitted over TLS.</p>
      </div>
      <div className="mt-8">
        <NextButton onClick={onNext} loading={loading} />
      </div>
    </Card>
  );
}

function VerificationStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-[#1a1f36] mb-2">Identity verification</h2>
      <p className="text-sm text-[#697386] mb-6">We need to verify the identity of the business owner.</p>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>First name</Label>
            <Input placeholder="Jane" />
          </div>
          <div>
            <Label>Last name</Label>
            <Input placeholder="Smith" />
          </div>
        </div>
        <div>
          <Label>Date of birth</Label>
          <Input placeholder="MM / DD / YYYY" />
        </div>
        <div>
          <Label>Last 4 digits of SSN</Label>
          <Input placeholder="XXXX" />
        </div>
        <div>
          <Label>Home address</Label>
          <Input placeholder="456 Oak Ave" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label>City</Label>
            <Input placeholder="Oakland" />
          </div>
          <div>
            <Label>State</Label>
            <Select>
              <option>CA</option><option>NY</option><option>TX</option><option>WA</option>
            </Select>
          </div>
          <div>
            <Label>ZIP</Label>
            <Input placeholder="94601" />
          </div>
        </div>
        <div>
          <Label>Phone number</Label>
          <Input placeholder="+1 (555) 000-0000" type="tel" />
        </div>
      </div>
      <div className="mt-8">
        <NextButton onClick={onNext} loading={loading} label="Submit verification" />
      </div>
    </Card>
  );
}

function CompleteStep({ onFinish, loading }: { onFinish: () => void; loading: boolean }) {
  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-[#edfdf4] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#09825d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[#1a1f36] mb-3">You're all set!</h2>
        <p className="text-sm text-[#697386] mb-2 leading-relaxed">
          Your Stripe Express account has been created and verified. You can now receive payments directly to your bank account.
        </p>
        <p className="text-xs text-[#697386] mb-8">
          Account ID: <span className="font-mono text-[#1a1f36]">acct_demo_{Math.random().toString(36).slice(2, 10)}</span>
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Identity', status: 'Verified' },
            { label: 'Bank account', status: 'Connected' },
            { label: 'Payouts', status: 'Enabled' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-[#f7f8fa] rounded-lg text-center">
              <div className="w-7 h-7 bg-[#09825d] rounded-full flex items-center justify-center mx-auto mb-1.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-[#1a1f36]">{item.label}</p>
              <p className="text-xs text-[#09825d]">{item.status}</p>
            </div>
          ))}
        </div>

        <NextButton onClick={onFinish} loading={loading} label="Return to dashboard" />
      </div>
    </Card>
  );
}
