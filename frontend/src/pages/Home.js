import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, User, CheckCircle, Clock, Shield } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Home = () => {
    return (
        <div className="min-h-screen bg-paper flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-center gap-12 pt-24 md:pt-0">

                <div className="flex-1 text-center md:text-left space-y-8 animate-fade-in">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary-dark text-sm font-medium mb-6 border border-primary/20">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            Available for Instant Quotes
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-dark leading-tight font-serif">
                            Home Repairs, <br />
                            <span className="text-primary italic">Simplified.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-secondary mt-6 max-w-lg mx-auto md:mx-0 leading-relaxed font-light">
                            Snap a photo of your problem, get a quote, and get it fixed.
                            Professional craftsmanship without the hassle.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Link
                            to="/new-request"
                            className="btn-primary lg shadow-artisan"
                        >
                            <Camera size={20} />
                            Get Fixed Now
                        </Link>

                        <Link
                            to="/customer-portal"
                            className="btn-secondary lg"
                        >
                            <User size={20} />
                            Track Request
                        </Link>
                    </div>

                    <div className="text-center md:text-left mt-6">
                        <Link to="/contractor/register" className="text-sm font-medium text-primary hover:text-primary-dark underline decoration-2 underline-offset-4">
                            Are you a Contractor? Join as a Pro →
                        </Link>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-8 pt-6 text-secondary/80 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <span>Fast Response</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-primary" />
                            <span>Licensed & Insured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-primary" />
                            <span>Satisfaction Guaranteed</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative w-full max-w-lg hidden md:block">
                    <div className="absolute -top-12 -right-12 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative bg-surface p-8 rounded-xl shadow-artisan border border-primary/10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                <Camera className="text-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-dark font-serif text-lg">Leaky Faucet</h3>
                                <p className="text-sm text-secondary">Kitchen Sink</p>
                            </div>
                            <span className="ml-auto px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                Quoted
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="h-2 bg-paper rounded-full w-3/4"></div>
                            <div className="h-2 bg-paper rounded-full w-1/2"></div>
                        </div>

                        <div className="p-4 bg-paper rounded-lg border border-primary/10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary/10 rounded-md overflow-hidden grayscale">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="Tech" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-dark">Technician arriving in</p>
                                <p className="text-xs text-primary font-bold">15 minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
