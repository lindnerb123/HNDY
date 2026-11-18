import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, CheckCircle, Clock, Video, FileText, User, Lock, AlertCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const VettingCard = ({ title, description, status, icon: Icon, actionLabel, onAction, locked }) => {
    const statusColors = {
        pending: 'bg-gray-100 text-gray-500',
        in_review: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    };

    const StatusIcon = {
        pending: Clock,
        in_review: Clock,
        approved: CheckCircle,
        rejected: AlertCircle
    }[status] || Clock;

    return (
        <div className={`bg-white rounded-xl border ${locked ? 'border-gray-100 opacity-60' : 'border-gray-200'} p-6 relative overflow-hidden transition-all hover:shadow-md`}>
            {locked && (
                <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Lock className="text-gray-400" size={24} />
                </div>
            )}

            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/5 rounded-lg text-primary">
                    <Icon size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors[status] || statusColors.pending}`}>
                    <StatusIcon size={12} />
                    {status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{description}</p>

            <button
                onClick={onAction}
                disabled={locked || status === 'approved' || status === 'in_review'}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2
                    ${status === 'approved'
                        ? 'bg-green-50 text-green-700 cursor-default'
                        : 'bg-dark text-white hover:bg-black'
                    }`}
            >
                {status === 'approved' ? 'Completed' : actionLabel}
            </button>
        </div>
    );
};

const VettingDashboard = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('contractorToken');
                if (!token) {
                    navigate('/contractor/login');
                    return;
                }

                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/contractor/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401) {
                    navigate('/contractor/login');
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    // GATEKEEPER CHECK
                    if (!data.feePaid) {
                        navigate('/contractor/payment');
                        return;
                    }
                    setStatus(data.status);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [navigate]);

    const handleAction = (step) => {
        console.log('Action for step:', step);
        // Implement modal or navigation for each step here using `gatekeeper-flow` logic
        alert(`Starting ${step} flow... (Mock)`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Vetting Dashboard</h1>
                    <p className="text-gray-500">Complete these 5 steps to get verified and start accepting jobs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <VettingCard
                        title="Identity Verification"
                        description="Verify your identity using a government-issued ID via Veriff."
                        status={status?.identity}
                        icon={User}
                        actionLabel="Start Verification"
                        onAction={() => handleAction('identity')}
                    />

                    <VettingCard
                        title="Criminal Background"
                        description="Complete a NY State criminal, sex offender, and terror watch list check via Yardstik."
                        status={status?.background}
                        icon={Shield}
                        actionLabel="Start Background Check"
                        onAction={() => handleAction('background')}
                    />

                    <VettingCard
                        title="Insurance (COI)"
                        description="Upload your Certificate of Insurance (COI) proving liability coverage."
                        status={status?.insurance}
                        icon={FileText}
                        actionLabel="Upload COI"
                        onAction={() => handleAction('insurance')}
                    />

                    <VettingCard
                        title="Digital Audit"
                        description="Upload a 30-second video walkthrough of your work vehicle and tools (Internal Use)."
                        status={status?.digital_audit}
                        icon={Video}
                        actionLabel="Record Audit Video"
                        onAction={() => handleAction('digital_audit')}
                    />

                    <VettingCard
                        title="Intro Video"
                        description="A friendly public-facing video introducing yourself to customers."
                        status={status?.intro_video}
                        icon={Video}
                        actionLabel="Record Intro Video"
                        onAction={() => handleAction('intro_video')}
                    />

                    {/* Certification Fee Card (Completed) */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                                <Shield className="text-green-400" size={24} />
                            </div>
                            <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium flex items-center gap-1.5">
                                <CheckCircle size={12} />
                                PAID
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Certification Fee</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            $149.00 fee paid. Covers administrative credentialing costs.
                        </p>
                        <div className="text-xs text-slate-500">
                            NY FAIR Act Disclosure Accepted
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VettingDashboard;
