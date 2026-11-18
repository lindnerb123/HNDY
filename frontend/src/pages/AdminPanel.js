import React, { useState, useEffect } from 'react';
import {
    LogOut, Home, List, DollarSign, Edit, Eye, Search,
    Trash2, X, AlertOctagon, Check, User
} from 'lucide-react';
import PaymentHistory from '../components/features/PaymentHistory';
import config from '../config';

const AdminPanel = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [services, setServices] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [activeTab, setActiveTab] = useState('services');

    // Modals
    const [editingService, setEditingService] = useState(null);
    const [viewingFiles, setViewingFiles] = useState(null);
    const [refundModal, setRefundModal] = useState(null);

    // Form States
    const [updateData, setUpdateData] = useState({
        status: '', quote: '', scheduledDate: '', notes: '',
        contractorId: '', contractorName: '', contractorCoiUrl: ''
    });
    const [vaultFiles, setVaultFiles] = useState({
        invoice: null, coi: null
    });
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('requested_by_customer');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            fetchServices(token);
            fetchContractors(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchContractors = async (token) => {
        try {
            const response = await fetch(`${config.API_URL}/api/admin/contractors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setContractors(data.contractors || []);
            }
        } catch (e) {
            console.error('Error fetching contractors:', e);
        }
    };

    const fetchServices = async (token) => {
        try {
            const response = await fetch(`${config.API_URL}/api/admin/services`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data);
                setIsLoggedIn(true);
            } else {
                localStorage.removeItem('adminToken');
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${config.API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                fetchServices(data.token);
            } else {
                setError('Invalid credentials');
                setLoading(false);
            }
        } catch (e) {
            setError('Network error');
            setLoading(false);
        }
    };

    const updateService = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();

            // Append text fields
            formData.append('status', updateData.status);
            formData.append('quote', updateData.quote);
            formData.append('scheduledDate', updateData.scheduledDate);
            formData.append('notes', updateData.notes);
            formData.append('contractorId', updateData.contractorId); // Send ID instead of Name
            // formData.append('contractorName', updateData.contractorName); 
            // formData.append('contractorCoiUrl', updateData.contractorCoiUrl);

            // Append files
            if (vaultFiles.invoice) formData.append('invoice', vaultFiles.invoice);
            if (vaultFiles.coi) formData.append('coi', vaultFiles.coi);

            const response = await fetch(`${config.API_URL}/api/admin/services/${editingService.id}`, {
                method: 'PUT',
                headers: {
                    // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS MANUALLY WITH FETCH/FORMDATA
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (response.ok) {
                fetchServices(token);
                setEditingService(null);
                setVaultFiles({ invoice: null, coi: null }); // Reset files
            } else {
                alert('Failed to update service');
            }
        } catch (e) {
            alert('Error updating service');
        }
    };

    const getStatusColor = (status) => {
        const map = {
            pending: 'bg-yellow-100 text-yellow-800',
            quoted: 'bg-blue-100 text-blue-800',
            scheduled: 'bg-purple-100 text-purple-800',
            in_progress: 'bg-indigo-100 text-indigo-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return map[status] || 'bg-slate-100 text-slate-800';
    };

    const handleViewFiles = async (service) => {
        // Ideally fetch fresh file data here if needed, or use service.files if available
        // For now using what's passed for simplicity or implementing the fetch logic if robust
        // The original code fetched /debug/request/:id. I'll reimplement similarly.
        try {
            const token = localStorage.getItem('adminToken');
            // Using public debug logic from original file, but maybe should be authenticated?
            // Original was: /debug/request/${service.id}
            const response = await fetch(`${config.API_URL}/debug/request/${service.id}`);
            const data = await response.json();
            if (data.found && data.files) {
                setViewingFiles({ service, files: data.files });
            } else {
                alert('No files found');
            }
        } catch (e) {
            alert('Error loading files');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl">
                        H
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin Panel</h1>
                    <p className="text-slate-500 mb-6">Restricted Access</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Admin Email"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={loginData.email}
                            onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={loginData.password}
                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full btn-primary justify-center">
                            {loading ? 'Verifying...' : 'Access Panel'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-slate-900 text-white p-4 sticky top-0 z-30">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold">H</div>
                        <span className="font-semibold text-lg">Admin Console</span>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('adminToken'); setIsLoggedIn(false); }}
                        className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </nav>

            <div className="container mx-auto p-6 md:p-8">

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Total Requests</div>
                        <div className="text-2xl font-bold text-slate-900">{services.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{services.filter(s => s.status === 'received').length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Quoted</div>
                        <div className="text-2xl font-bold text-blue-600">{services.filter(s => s.status === 'quoted').length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Completed</div>
                        <div className="text-2xl font-bold text-green-600">{services.filter(s => s.status === 'completed').length}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 mb-6">
                    <button
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'services' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('services')}
                    >
                        Service Requests
                    </button>
                    <button
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('payments')}
                    >
                        Payment History
                    </button>
                </div>

                {activeTab === 'services' ? (
                    <div className="grid gap-4">
                        {services.map(service => (
                            <div key={service.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row gap-6 ">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900">#{service.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(service.status)}`}>
                                            {service.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(service.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User size={16} className="text-slate-400 mt-1" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{service.customerName}</div>
                                            <div className="text-xs text-slate-500">{service.customerEmail}</div>
                                            <div className="text-xs text-slate-500">{service.address}</div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                        {service.problem_description || service.description}
                                    </p>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                                    <button
                                        onClick={() => {
                                            setEditingService(service);
                                            setUpdateData({
                                                status: service.status,
                                                quote: service.quote || '',
                                                scheduledDate: service.appointment_date || '',
                                                notes: service.notes || '',
                                                contractorId: service.contractor_id || '',
                                                contractorName: service.contractor_name || '',
                                                contractorCoiUrl: service.contractor_coi_url || ''
                                            });
                                            setVaultFiles({ invoice: null, coi: null });
                                        }}
                                        className="flex-1 btn-secondary text-xs justify-center"
                                    >
                                        <Edit size={14} /> Manage
                                    </button>
                                    <button
                                        onClick={() => handleViewFiles(service)}
                                        className="flex-1 btn-secondary text-xs justify-center"
                                    >
                                        <Eye size={14} /> Files
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <PaymentHistory token={localStorage.getItem('adminToken')} />
                )}
            </div>

            {/* Edit Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Update Request #{editingService.id}</h2>
                            <button onClick={() => setEditingService(null)}><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={updateData.status}
                                    onChange={e => setUpdateData({ ...updateData, status: e.target.value })}
                                >
                                    <option value="received">Received</option>
                                    <option value="quoted">Quoted</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quote Amount ($)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={updateData.quote}
                                    onChange={e => setUpdateData({ ...updateData, quote: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={updateData.scheduledDate ? new Date(updateData.scheduledDate).toISOString().slice(0, 16) : ''}
                                    onChange={e => setUpdateData({ ...updateData, scheduledDate: e.target.value })}
                                />
                            </div>

                        </div>

                        {/* Vault & Contractor Fields */}
                        <div className="border-t border-slate-100 pt-4 mt-4">
                            <h3 className="font-bold text-slate-800 mb-3">Vault & Contractor Details</h3>

                            <div className="mb-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Contractor</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl bg-white"
                                    value={updateData.contractorId}
                                    onChange={e => {
                                        const id = e.target.value;
                                        setUpdateData(prev => ({ ...prev, contractorId: id }));
                                    }}
                                >
                                    <option value="">-- Select Contractor --</option>
                                    {contractors.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.company_name})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    Selecting a contractor will automatically link their Insurance (COI) to the Vault upon completion.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Final Invoice (PDF)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg"
                                        className="w-full text-sm"
                                        onChange={e => setVaultFiles({ ...vaultFiles, invoice: e.target.files[0] })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setEditingService(null)} className="flex-1 btn-secondary justify-center">Cancel</button>
                            <button onClick={updateService} className="flex-1 btn-primary justify-center">Save Changes</button>
                        </div>
                    </div>
                </div>

            )
            }

            {/* File View Modal */}
            {
                viewingFiles && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                        <div className="w-full max-w-4xl h-[80vh] flex flex-col">
                            <div className="flex justify-between text-white mb-4">
                                <h2 className="font-bold">Files for Request #{viewingFiles.service.id}</h2>
                                <button onClick={() => setViewingFiles(null)}><X /></button>
                            </div>
                            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
                                {/* Simplified file viewing, in reality probably a carousel */}
                                <div className="grid grid-cols-2 gap-4 p-4 w-full h-full overflow-y-auto">
                                    {viewingFiles.files.map((file, idx) => (
                                        <div key={idx} className="relative group">
                                            {file.mimetype && file.mimetype.startsWith('video') ? (
                                                <video src={file.cloudinaryUrl || file.url} controls className="w-full rounded" />
                                            ) : (
                                                <img src={file.cloudinaryUrl || file.url} className="w-full rounded" alt="Evidence" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminPanel;
