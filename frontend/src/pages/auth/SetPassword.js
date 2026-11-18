import React, { useState, useEffect } from 'react';
import { Loader2, Check, Lock } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import config from '../../config';

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token || !email) {
            navigate('/customer-portal');
        }
    }, [token, email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/auth/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, token })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setSuccess(true);
                if (data.token) {
                    localStorage.setItem('hndy_token', data.token);
                    localStorage.setItem('hndy_customer', JSON.stringify(data.customer));
                    setTimeout(() => navigate('/customer-portal'), 2000);
                }
            } else {
                setError(data.message || 'Failed to set password');
            }
        } catch (e) {
            setError('Network error');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Activated!</h2>
                    <p className="text-slate-500">Redirecting to portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Set Password</h2>
                    <p className="text-slate-500 mt-2 text-sm">Account: {email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800">
                        Must be at least 8 characters long.
                    </div>

                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
