import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { CreditCard, Check, Lock, Loader2 } from 'lucide-react';
import config from '../../config';

let stripePromise = null;

const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1e293b',
            '::placeholder': { color: '#94a3b8' },
            fontFamily: 'Inter, sans-serif',
            iconColor: '#b4692f', // Primary Bronze
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
};

const CheckoutForm = ({ request, onPaymentSuccess, token }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                const response = await axios.post(`${config.API_URL}/api/stripe/create-payment-intent`, {
                    requestId: request.id
                });
                setClientSecret(response.data.clientSecret);
            } catch (error) {
                console.error('Error creating payment intent:', error);
                setError('Failed to initialize payment. Please try again.');
            }
        };

        if (request && (request.quote || request.quoteAmount)) {
            createPaymentIntent();
        }
    }, [request]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: request.customerName,
                    email: request.customerEmail,
                },
            },
        });

        if (stripeError) {
            setError(stripeError.message);
            setProcessing(false);
            return;
        }

        try {
            const response = await axios.post(`${config.API_URL}/api/stripe/confirm-payment`, {
                paymentIntentId: paymentIntent.id,
                requestId: request.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSucceeded(true);
                setProcessing(false);
                setTimeout(() => onPaymentSuccess(response.data.request), 2000);
            } else {
                setError('Payment processed but backend update failed. Contact support.');
                setProcessing(false);
            }
        } catch (error) {
            console.error('Backend notification failed:', error);
            if (error.response?.status === 400 && error.response?.data?.error?.includes('already succeeded')) {
                setError('Payment was successful! Please refresh page.');
            } else {
                setError('Payment successful, but status update failed. Contact support.');
            }
            setProcessing(false);
        }
    };

    if (succeeded) {
        return (
            <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-200">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-2 font-serif">Payment Successful!</h3>
                <p className="text-secondary">Thank you! We'll contact you soon.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
                <label className="block text-sm font-medium text-secondary mb-2">Card Information</label>
                <div className="p-4 border border-secondary/20 rounded-lg bg-surface shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <CardElement options={cardElementOptions} />
                </div>
                <p className="text-xs text-secondary/60 mt-2 flex items-center gap-1.5">
                    <Lock size={12} />
                    Your payment info is secure and encrypted
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing || !clientSecret}
                className="w-full btn-primary lg justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-artisan"
            >
                {processing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        Pay ${request.quote || request.quoteAmount}
                    </>
                )}
            </button>

            <p className="text-center text-xs text-secondary/40 mt-4">
                Powered by Stripe • Test mode
            </p>
        </form>
    );
};

const PaymentCheckout = ({ request, onPaymentSuccess, token }) => {
    const [stripeLoaded, setStripeLoaded] = useState(false);

    useEffect(() => {
        const loadStripeKey = async () => {
            try {
                const response = await axios.get(`${config.API_URL}/api/stripe/config`);
                stripePromise = loadStripe(response.data.publishableKey);
                setStripeLoaded(true);
            } catch (error) {
                console.error('Error loading Stripe:', error);
            }
        };
        loadStripeKey();
    }, []);

    if (!stripeLoaded || !stripePromise) {
        return (
            <div className="text-center py-8">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-secondary text-sm">Loading payment system...</p>
            </div>
        );
    }

    return (
        <div className="bg-paper rounded-xl p-6 shadow-artisan border border-primary/10">
            <h2 className="text-lg font-semibold text-dark mb-2 font-serif">Complete Payment</h2>
            <p className="text-sm text-secondary mb-6">Pay for service request #{request.id}</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                <span className="font-medium text-green-700">Quote Amount:</span>
                <span className="text-2xl font-bold text-green-700 font-serif">${request.quote || request.quoteAmount}</span>
            </div>

            <Elements stripe={stripePromise}>
                <CheckoutForm request={request} onPaymentSuccess={onPaymentSuccess} token={token} />
            </Elements>
        </div>
    );
};

export default PaymentCheckout;
