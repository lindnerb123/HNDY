import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 mt-20">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">HNDY<span className="text-sky-500">.</span></h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Professional handyman services at your fingertips.
                            Quick, reliable, and transparent.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Services</h3>
                        <ul className="space-y-2 text-sm">
                            <li>General Repairs</li>
                            <li>Plumbing Minor</li>
                            <li>Electrical Minor</li>
                            <li>Furniture Assembly</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact</h3>
                        <ul className="space-y-2 text-sm">
                            <li>hi@hndy.co</li>
                            <li>Emergency Support Available 24/7</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} HNDY App. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
