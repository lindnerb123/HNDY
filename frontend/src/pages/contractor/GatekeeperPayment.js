import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            return;
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            }
        });

        if (result.error) {
            setError(result.error.message);
            setProcessing(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                onSuccess(result.paymentIntent.id);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                }} />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
                {processing ? 'Processing...' : (
                    <>
                        <Lock size={18} />
                        Pay $149.00 Securely
                    </>
                )}
            </button>
        </form>
    );
};

const GatekeeperPayment = () => {
    const navigate = useNavigate();
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch payment intent
        const initPayment = async () => {
            try {
                const token = localStorage.getItem('contractorToken');
                if (!token) {
                    navigate('/contractor/login');
                    return;
                }

                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/contractor/payment/initiate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (data.success) {
                    setClientSecret(data.clientSecret);
                } else {
                    // Handle error
                    console.error('Failed to init payment');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initPayment();
    }, [navigate]);

    const handlePaymentSuccess = async (paymentId) => {
        try {
            const token = localStorage.getItem('contractorToken');
            await fetch(`${process.env.REACT_APP_API_URL}/api/contractor/payment/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentIntentId: paymentId })
            });
            navigate('/contractor/dashboard');
        } catch (err) {
            console.error('Confirmation failed', err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading secure checkout...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">

                    {/* Left: Value Prop */}
                    <div className="bg-slate-900 text-white p-8 md:w-1/2 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                                <Shield size={14} className="text-green-400" />
                                Official Certification
                            </div>
                            <h2 className="text-3xl font-bold font-serif mb-4">Unlock Your Pro Status</h2>
                            <p className="text-slate-300 leading-relaxed mb-6">
                                Complete your certification to start accepting jobs. This one-time fee covers your comprehensive vetting and background checks.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-400 shrink-0 mt-1" size={18} />
                                    <span className="text-sm text-slate-200">Identity & Liveness Verification</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-400 shrink-0 mt-1" size={18} />
                                    <span className="text-sm text-slate-200">NY State Criminal Background Check</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-400 shrink-0 mt-1" size={18} />
                                    <span className="text-sm text-slate-200">Insurance & License Verification</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-400 shrink-0 mt-1" size={18} />
                                    <span className="text-sm text-slate-200">Digital Audit & Tools Inspection</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-8 text-xs text-slate-500 border-t border-white/10 pt-6">
                            <p className="font-semibold text-slate-400 mb-1">NY FAIR Business Practices Act Disclosure</p>
                            <p>This $149.00 fee is a cost-recovery charge for administrative vetting and is strictly non-refundable once processing begins.</p>
                        </div>
                    </div>

                    {/* Right: Payment Form */}
                    <div className="p-8 md:w-1/2 bg-white">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Secure Payment</h3>
                            <p className="text-sm text-gray-500">Pay with credit card via Stripe</p>
                        </div>

                        {clientSecret && (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
                            </Elements>
                        )}

                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Lock size={12} />
                            <span>256-bit SSL Encrypted Payment</span>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default GatekeeperPayment;
