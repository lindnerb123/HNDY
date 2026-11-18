import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = ({ onInstall, onDismiss }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50"
            >
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone className="w-6 h-6 text-sky-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900">Install HNDY App</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Add to home screen for quick access</p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onInstall}
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                        >
                            <Download size={16} />
                            Install
                        </button>
                        <button
                            onClick={onDismiss}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
                        >
                            Not Now
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
