import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Search } from 'lucide-react';
import config from '../../config';

const PaymentHistory = ({ token }) => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/api/admin/payment-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching payment history:', error);
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            failed: 'bg-red-100 text-red-700',
            refunded: 'bg-purple-100 text-purple-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const filteredPayments = payments.filter(payment => {
        if (filter !== 'all' && payment.status !== filter) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                payment.id.toLowerCase().includes(search) ||
                payment.requestId.toLowerCase().includes(search) ||
                payment.customerName.toLowerCase().includes(search) ||
                payment.customerEmail.toLowerCase().includes(search)
            );
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mb-3" />
                <p className="text-slate-500">Loading payment history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-green-50 p-3 rounded-lg text-green-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">${stats.totalRevenue.toFixed(2)}</p>
                            <p className="text-sm text-slate-500">Total Revenue</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                            <p className="text-sm text-slate-500">Successful Payments</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Pending</span>
                            <span className="font-semibold text-slate-900">{stats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Failed</span>
                            <span className="font-semibold text-slate-900">{stats.failed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Refunded</span>
                            <span className="font-semibold text-slate-900">{stats.refunded}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['all', 'completed', 'pending', 'failed', 'refunded'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${filter === status
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                    <button
                        onClick={fetchPaymentHistory}
                        className="px-3 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 font-semibold text-slate-600 text-sm">ID</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Request</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Customer</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Amount</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No payments found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-sm font-mono text-slate-500">{payment.id.slice(-8)}...</td>
                                        <td className="p-4 text-sm text-slate-900">{payment.requestId}</td>
                                        <td className="p-4 text-sm">
                                            <div className="font-medium text-slate-900">{payment.customerName}</div>
                                            <div className="text-slate-500 text-xs">{payment.customerEmail}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-semibold text-slate-900">${payment.amount.toFixed(2)}</div>
                                            {payment.refundAmount && (
                                                <div className="text-xs text-purple-600">Refunded: ${payment.refundAmount.toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;
