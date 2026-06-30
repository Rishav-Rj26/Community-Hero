import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-400 shrink-0" size={20} />;
      case 'error': return <XCircle className="text-rose-400 shrink-0" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-400 shrink-0" size={20} />;
      case 'info':
      default: return <Info className="text-blue-400 shrink-0" size={20} />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/30';
      case 'error': return 'border-rose-500/30';
      case 'warning': return 'border-amber-500/30';
      case 'info':
      default: return 'border-blue-500/30';
    }
  };

  const getProgressBarColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-400';
      case 'error': return 'bg-rose-400';
      case 'warning': return 'bg-amber-400';
      case 'info':
      default: return 'bg-blue-400';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full sm:w-[350px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto bg-slate-900/90 backdrop-blur-md border ${getBorderColor(toast.type)} shadow-lg rounded-lg overflow-hidden flex flex-col relative`}
          >
            <div className="p-3 pr-10 flex gap-3">
              {getIcon(toast.type)}
              <div>
                <h4 className="text-sm font-semibold text-white leading-tight">{toast.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
              </div>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X size={16} />
            </button>
            
            {/* Auto-dismiss progress bar (4 seconds) */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className={`h-0.5 ${getProgressBarColor(toast.type)} absolute bottom-0 left-0`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
