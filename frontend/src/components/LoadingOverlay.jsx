import React from 'react';

const LoadingOverlay = ({ message = "Syncing Academic Data..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="relative">
        {/* Outer Glow Effect */}
        <div className="absolute -inset-4 bg-brand-500/20 blur-2xl rounded-full animate-pulse"></div>
        
        {/* Main Spinner Container */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Modern Gradient Spinner */}
          <svg className="w-full h-full animate-[spin_2s_linear_infinite]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle
              className="stroke-slate-200 dark:stroke-slate-800"
              cx="50"
              cy="50"
              r="42"
              strokeWidth="6"
              fill="none"
            />
            <path
              className="stroke-brand-500"
              d="M 50 8 A 42 42 0 0 1 92 50"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              stroke="url(#spinner-grad)"
            />
          </svg>
          
          {/* Inner Logo / Branding */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 flex items-center justify-center group transition-transform duration-500">
                <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-br from-brand-500 to-indigo-600">AE</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Status */}
      <div className="mt-12 text-center space-y-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.4em] animate-pulse">
            {message}
        </h2>
        <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <div 
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand-500/40"
                    style={{
                        animation: `loadingDots 1.4s infinite ease-in-out both`,
                        animationDelay: `${i * 0.16}s`
                    }}
                />
            ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loadingDots {
            0%, 80%, 100% { transform: scale(0); opacity: 0; }
            40% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default LoadingOverlay;
