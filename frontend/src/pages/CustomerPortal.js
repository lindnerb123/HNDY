import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Home, Clock, CheckCircle, AlertCircle, ChevronRight, ArrowLeft, FileText, Download, DollarSign } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PushNotificationManager from '../components/features/PushNotificationManager';
import PaymentCheckout from '../components/features/PaymentCheckout';
import config from '../config';

const CustomerPortal = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('hndy_token');
        const savedCustomer = localStorage.getItem('hndy_customer');
        if (savedToken && savedCustomer) {
            setToken(savedToken);
            setCustomer(JSON.parse(savedCustomer));
            setIsLoggedIn(true);
            fetchRequests(savedToken);
        }
    }, []);

    const fetchRequests = async (authToken) => {
        try {
            const response = await axios.get(`${config.API_URL}/customer/requests`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (response.data.success) {
                setRequests(response.data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${config.API_URL}/auth/login`, loginForm);
            if (response.data.success) {
                const { token: newToken, customer: customerData } = response.data;
                setToken(newToken);
                setCustomer(customerData);
                setIsLoggedIn(true);
                localStorage.setItem('hndy_token', newToken);
                localStorage.setItem('hndy_customer', JSON.stringify(customerData));
                fetchRequests(newToken);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setToken(null);
        setCustomer(null);
        setRequests([]);
        localStorage.removeItem('hndy_token');
        localStorage.removeItem('hndy_customer');
        navigate('/');
    };

    const getStatusColor = (status) => {
        const map = {
            received: 'bg-yellow-100 text-yellow-800',
            quoted: 'bg-blue-100 text-blue-800',
            scheduled: 'bg-purple-100 text-purple-800',
            in_progress: 'bg-indigo-100 text-indigo-800',
            completed: 'bg-green-100 text-green-800'
        };
        return map[status] || 'bg-slate-100 text-slate-800';
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                        <p className="text-slate-500 mt-2">Sign in to track your requests</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary justify-center py-2.5"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-sm text-slate-500 hover:text-sky-500">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedRequest) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
                    <button
                        onClick={() => setSelectedRequest(null)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Requests
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Request #{selectedRequest.id}</h1>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Description</h3>
                                <p className="text-slate-900">{selectedRequest.problem_description || 'No description provided'}</p>
                            </div>

                            {selectedRequest.quote && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-medium text-slate-700">Quote Amount</span>
                                        <span className="text-2xl font-bold text-slate-900">${selectedRequest.quote}</span>
                                    </div>

                                    {selectedRequest.status === 'quoted' && !selectedRequest.payment_status && (
                                        <button
                                            onClick={() => setShowPayment(true)}
                                            className="w-full btn-primary justify-center"
                                        >
                                            Pay Now
                                        </button>
                                    )}

                                    {selectedRequest.payment_status === 'completed' && (
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                            <CheckCircle size={18} />
                                            <span className="font-medium">Payment Completed</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HNDY Home Vault */}
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Home className="w-5 h-5 text-sky-600" />
                                            HNDY Home Vault
                                        </h3>
                                        <p className="text-sm text-slate-500">Secure storage for your project docs</p>
                                    </div>
                                    {selectedRequest.vault_locked ? (
                                        <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                            <AlertCircle size={12} /> Locked
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} /> Active
                                        </div>
                                    )}
                                </div>

                                {selectedRequest.vault_locked ? (
                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed text-center">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <DollarSign className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <h4 className="font-semibold text-slate-900">Vault is Locked</h4>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Complete payment to unlock your Warranty, Invoice, and Contractor Insurance.
                                        </p>
                                        {!selectedRequest.payment_status && selectedRequest.status === 'quoted' && (
                                            <button
                                                onClick={() => setShowPayment(true)}
                                                className="text-sm text-sky-600 font-medium hover:underline"
                                            >
                                                Pay now to unlock
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {selectedRequest.vault_documents && JSON.parse(selectedRequest.vault_documents).map((doc, idx) => (
                                            <a
                                                key={idx}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-500 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 group-hover:text-sky-600 transition-colors">
                                                            {doc.name}
                                                        </div>
                                                        <div className="text-xs text-slate-400">{doc.filename} • {new Date(doc.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <Download className="text-slate-300 group-hover:text-sky-500" size={18} />
                                            </a>
                                        ))}
                                        {(!selectedRequest.vault_documents || JSON.parse(selectedRequest.vault_documents).length === 0) && (
                                            <div className="text-center p-4 text-slate-400 text-sm italic">
                                                No documents generated yet.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>


                            {showPayment && (
                                <div className="mt-6">
                                    <PaymentCheckout
                                        request={selectedRequest}
                                        token={token}
                                        onPaymentSuccess={(updatedReq) => {
                                            setSelectedRequest(updatedReq);
                                            setShowPayment(false);
                                            fetchRequests(token);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <PushNotificationManager token={token} userEmail={customer?.email} />

            <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
                        <p className="text-slate-500">Manage your service history</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-secondary"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No requests yet</h3>
                        <p className="text-slate-500 mt-1">Submit a new request to get started</p>
                        <Link to="/new-request" className="btn-primary mt-6 inline-flex">
                            New Request
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                onClick={() => setSelectedRequest(request)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-slate-900">#{request.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusColor(request.status)}`}>
                                            {request.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate max-w-md">
                                        {request.problem_description || 'Service Request'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerPortal;
