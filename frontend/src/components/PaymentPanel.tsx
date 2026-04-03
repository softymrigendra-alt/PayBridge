import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { opportunitiesApi } from '../api/opportunities';
import { Spinner } from './Spinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

function CheckoutForm({
  opportunityId,
  amount,
  onSuccess,
}: {
  opportunityId: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'init' | 'card'>('init');

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const initPayment = async () => {
    setLoading(true);
    try {
      const result = await opportunitiesApi.charge(opportunityId);
      setClientSecret(result.clientSecret);
      setStep('card');
    } catch (err) {
      toast.error('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    const card = elements.getElement(CardElement);
    if (!card) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      toast.success('Payment succeeded!');
      onSuccess();
    }
  };

  if (step === 'init') {
    return (
      <div className="text-center py-4">
        <p className="text-3xl font-bold text-gray-900 mb-1">{fmt.format(amount)}</p>
        <p className="text-gray-500 text-sm mb-6">Ready to charge</p>
        <button onClick={initPayment} disabled={loading} className="btn-primary">
          {loading ? <Spinner size="sm" /> : null}
          Initialize Payment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={confirmPayment} className="space-y-4">
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-4 text-center">{fmt.format(amount)}</p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="border border-gray-300 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <CardElement
            options={{
              style: {
                base: { fontSize: '16px', color: '#111827', '::placeholder': { color: '#9ca3af' } },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </div>
      <button type="submit" disabled={loading || !stripe} className="btn-primary w-full">
        {loading ? <Spinner size="sm" /> : null}
        Confirm Payment
      </button>
    </form>
  );
}

export function PaymentPanel({
  opportunityId,
  amount,
  onSuccess,
}: {
  opportunityId: string;
  amount: number;
  onSuccess: () => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm opportunityId={opportunityId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
