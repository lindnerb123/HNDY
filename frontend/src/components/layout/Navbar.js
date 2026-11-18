import React, { useState, useEffect } from 'react';
import { User, Shield, Wrench, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ toggleAdmin, showAdminAccess, logoTapCount }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-paper/90 backdrop-blur-md shadow-sm border-b border-primary/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo with Secret Tap Handler */}
                <div className="flex flex-col select-none cursor-pointer group" onClick={toggleAdmin}>
                    <h1 className={`text-2xl font-bold tracking-tight font-serif transition-colors ${isScrolled ? 'text-dark' : 'text-dark'} ${logoTapCount > 0 && 'text-primary'}`}>
                        HNDY<span className="text-primary">.</span>
                    </h1>
                    {logoTapCount > 0 && (
                        <div className="flex gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${i < logoTapCount ? 'bg-primary' : 'bg-secondary/20'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/customer-portal" className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                        <User size={18} />
                        Customer Portal
                    </Link>

                    {showAdminAccess && (
                        <Link to="/admin-panel" className="flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors animate-pulse">
                            <Shield size={18} />
                            Admin Panel
                        </Link>
                    )}

                    <Link to="/new-request" className="btn-primary sm shadow-artisan">
                        <Wrench size={16} />
                        Book Service
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden text-secondary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-paper border-b border-primary/10 p-4 flex flex-col gap-4 shadow-xl">
                    <Link to="/customer-portal" className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface/80 text-secondary border border-primary/10">
                        <User size={20} />
                        Customer Portal
                    </Link>

                    {showAdminAccess && (
                        <Link to="/admin-panel" className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                            <Shield size={20} />
                            Admin Panel
                        </Link>
                    )}

                    <Link to="/new-request" className="btn-primary w-full justify-center shadow-artisan">
                        <Wrench size={18} />
                        Book Service
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
