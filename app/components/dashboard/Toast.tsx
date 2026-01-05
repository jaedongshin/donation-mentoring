'use client';

import { X } from 'lucide-react';

interface ToastProps {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}

export default function Toast({ type, message, onClose }: ToastProps) {
    return (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}


